import crypto from 'crypto';
import { matchSkills } from '../services/skills/matcher.js';
import { calculateMatchScore } from '../services/skills/scorer.js';
import { retrieveEvidenceForRequirements } from '../services/rag/retriever.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { GAP_ANALYSIS_SYSTEM_PROMPT, buildGapAnalysisUserPrompt, PROMPT_VERSION } from '../services/ai/prompts/gapAnalysis.v1.js';
import { verifyAndCleanAIOutput } from '../services/ai/verifier.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';

export async function createAnalysis(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const aiProvider = getAIProvider();
    const { resume_id, job_description_id, title } = req.body;

    if (!resume_id || !job_description_id) {
      return next(new AppError('resume_id and job_description_id are required.', 400, 'MISSING_FIELDS'));
    }

    // 1. Fetch resume and job description details
    const [resumeRes, jdRes] = await Promise.all([
      client.from('resumes').select('id, filename, extracted_text, version').eq('id', resume_id).eq('user_id', userId).single(),
      client.from('job_descriptions').select('id, title, company, parsed_data').eq('id', job_description_id).eq('user_id', userId).single()
    ]);

    if (resumeRes.error || !resumeRes.data) {
      return next(new AppError('Specified resume was not found.', 404, 'RESUME_NOT_FOUND'));
    }
    if (jdRes.error || !jdRes.data) {
      return next(new AppError('Specified job description was not found.', 404, 'JD_NOT_FOUND'));
    }

    const resume = resumeRes.data;
    const jd = jdRes.data;

    // 2. Fetch resume skills and JD requirements
    const [skillsRes, reqsRes] = await Promise.all([
      client.from('resume_skills').select('*').eq('resume_id', resume_id),
      client.from('job_requirements').select('*').eq('job_description_id', job_description_id)
    ]);

    const resumeSkills = skillsRes.data || [];
    const jobRequirements = reqsRes.data || [];

    // 3. Deterministic Matching & Scoring (ADR-01: Score Lock)
    const rawMatches = matchSkills(resumeSkills, resume.extracted_text, jobRequirements);
    const { match_score, alignment_level, score_breakdown, ranked_matches } = calculateMatchScore(rawMatches);

    // 4. Hybrid RAG Retrieval (ADR-03: pgvector + FTS via RRF)
    const { uniqueChunks, perRequirementEvidence } = await retrieveEvidenceForRequirements({
      userId,
      resumeId: resume_id,
      requirements: jobRequirements,
      supabaseClient: client
    });

    // 5. Grounded LLM Synthesis with Indirect Injection Protection (ADR-04)
    let aiSynthesis = null;
    try {
      const userPrompt = buildGapAnalysisUserPrompt({
        deterministicMatchData: {
          match_score,
          alignment_level,
          score_breakdown,
          skill_matches: ranked_matches.map((m) => ({
            skill: m.skill_name,
            status: m.status,
            weight: m.weight
          }))
        },
        retrievedResumeChunks: uniqueChunks,
        retrievedJdChunks: []
      });

      const rawAiJson = await aiProvider.generateStructuredJSON({
        systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.1
      });

      // 6. 3-Stage Verification Gate (Zod schema + citation check + repair)
      const verificationResult = verifyAndCleanAIOutput(rawAiJson, uniqueChunks);
      if (verificationResult.isValid && verificationResult.repaired) {
        aiSynthesis = verificationResult.repaired;
      }
    } catch (aiErr) {
      console.warn('[AIGenerationWarning] Graceful fallback to deterministic analysis:', aiErr.message);
    }

    const analysisId = crypto.randomUUID();
    const analysisTitle = title || `${jd.title || 'Role'} Match Analysis`;

    // 7. Insert into analyses table
    const { data: analysisRecord, error: insertErr } = await client
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userId,
        resume_id,
        resume_version: resume.version || 1,
        job_description_id,
        title: analysisTitle,
        status: 'completed',
        current_step: 'completed',
        match_score,
        alignment_level,
        score_breakdown,
        analysis_result: aiSynthesis || {
          summary: {
            role: jd.title,
            company: jd.company,
            overall_alignment: alignment_level,
            match_score,
            strengths: ['Deterministic verified skills recorded from candidate resume.'],
            limitations: ['Grounded narrative generation safely defaulted to deterministic verification.']
          },
          recommendations: []
        },
        model_version: 'gemini-1.5-flash',
        prompt_version: PROMPT_VERSION,
        schema_version: '1.0'
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('[AnalysisInsertError]:', insertErr);
      return next(new AppError('Failed to record analysis.', 500, 'DB_INSERT_FAILED'));
    }

    // 8. Insert rows into analysis_skill_matches with verified evidence
    if (ranked_matches.length > 0) {
      const matchRows = ranked_matches.map((m) => {
        // Attach retrieved chunk evidence if available
        const retrievedEv = perRequirementEvidence[m.skill_name] || [];
        const combinedResumeEv = m.resume_evidence.length > 0 ? m.resume_evidence : retrievedEv;

        return {
          analysis_id: analysisId,
          user_id: userId,
          skill_name: m.skill_name,
          jd_importance: m.jd_importance,
          status: m.status,
          weight: m.weight,
          score: m.score,
          confidence: m.confidence,
          priority_rank: m.priority_rank,
          resume_evidence: combinedResumeEv,
          jd_evidence: m.jd_evidence,
          explanation: m.explanation,
          recommended_next_step: m.status === 'missing' ? `Practice core concepts and build a hands-on project with ${m.skill_name}` : null
        };
      });

      await client.from('analysis_skill_matches').insert(matchRows);
    }

    return sendSuccess(req, res, {
      ...analysisRecord,
      skill_matches: ranked_matches,
      verified_evidence: perRequirementEvidence
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listAnalyses(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('analyses')
      .select('id, title, status, match_score, alignment_level, score_breakdown, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return sendPaginated(req, res, [], { page, limit, total: 0, total_pages: 0 });
    }

    const total = count || 0;
    return sendPaginated(req, res, data || [], {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysis(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const client = req.supabase || getServiceClient();

    const { data: analysis, error: aErr } = await client
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (aErr || !analysis) {
      return next(new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND'));
    }

    const { data: matches } = await client
      .from('analysis_skill_matches')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('priority_rank', { ascending: false });

    return sendSuccess(req, res, {
      ...analysis,
      skill_matches: matches || []
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAnalysis(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const { title } = req.body;
    const client = req.supabase || getServiceClient();

    if (!title || !title.trim()) {
      return next(new AppError('title is required.', 400, 'INVALID_INPUT'));
    }

    const { data, error } = await client
      .from('analyses')
      .update({ title: title.trim() })
      .eq('id', analysisId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      return next(new AppError('Analysis not found or update failed.', 404, 'UPDATE_FAILED'));
    }

    return sendSuccess(req, res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnalysis(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const client = req.supabase || getServiceClient();

    await client.from('analyses').delete().eq('id', analysisId).eq('user_id', userId);

    return sendSuccess(req, res, { deleted_id: analysisId });
  } catch (err) {
    next(err);
  }
}
