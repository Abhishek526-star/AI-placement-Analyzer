import crypto from 'crypto';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';
import { generateResumeSuggestionsWithAI } from '../services/ai/resumeSuggestionsEngine.js';
import { evaluateCandidateAnswer } from '../services/ai/answerEvaluationEngine.js';

export async function getOrGenerateInterviewQuestions(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const { regenerate = false } = req.body || {};
    const client = req.supabase || getServiceClient();
    const aiProvider = getAIProvider();

    // 1. Verify parent analysis exists and is completed
    const { data: analysis, error: aErr } = await client
      .from('analyses')
      .select('id, resume_id, job_description_id, status, title')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (aErr || !analysis) {
      return next(new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND'));
    }

    if (analysis.status !== 'completed') {
      return next(new AppError('Analysis is not completed yet.', 409, 'INVALID_STATE'));
    }

    // 2. Return cached questions unless regenerate: true
    if (!regenerate) {
      const { data: cached } = await client
        .from('interview_questions')
        .select('*')
        .eq('analysis_id', analysisId);

      if (cached && cached.length > 0) {
        return sendSuccess(req, res, cached);
      }
    }

    // 3. Fetch matched skills, gaps, and resume projects
    const [matchesRes, profileRes] = await Promise.all([
      client.from('analysis_skill_matches').select('skill_name, status, jd_importance').eq('analysis_id', analysisId),
      client.from('resume_profiles').select('parsed_data').eq('resume_id', analysis.resume_id).maybeSingle()
    ]);

    const skillMatches = matchesRes.data || [];
    const projects = profileRes.data?.parsed_data?.projects || [];

    // 4. Grounded Prompt for 10-20 Interview Questions across 6 PRD categories
    const systemPrompt = `You are an expert technical interviewer for AI Placement Analyzer.
Generate 10 to 15 grounded, role-specific interview questions for the candidate based strictly on their target role and resume projects.
Ground "project_deep_dive" questions strictly in the candidate's actual projects.

Categories must be one of:
- technical_fundamentals
- coding_dsa
- project_deep_dive
- technology_specific
- scenario_based
- behavioral_hr

Return JSON with structure:
{
  "questions": [
    {
      "question": "string",
      "category": "technical_fundamentals | coding_dsa | project_deep_dive | technology_specific | scenario_based | behavioral_hr",
      "difficulty": "easy | medium | hard",
      "why_relevant": "string",
      "related_skill": "string",
      "answer_outline": "string",
      "follow_up_questions": ["string"]
    }
  ]
}`;

    const userPrompt = `Role: ${analysis.title}
Matched Skills: ${skillMatches.filter((s) => s.status === 'matched').map((s) => s.skill_name).join(', ') || 'General Engineering'}
Missing Skills: ${skillMatches.filter((s) => s.status === 'missing').map((s) => s.skill_name).join(', ') || 'None'}
Candidate Projects: ${JSON.stringify(projects)}

Generate role-specific interview questions.`;

    let generatedQuestions = [];
    try {
      const result = await aiProvider.generateStructuredJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.3
      });
      generatedQuestions = result.questions || [];
    } catch (genErr) {
      // Deterministic fallback questions
      generatedQuestions = [
        {
          question: `Can you walk me through the architecture and design decisions of your primary project?`,
          category: 'project_deep_dive',
          difficulty: 'medium',
          why_relevant: 'Evaluates architectural clarity and project ownership.',
          related_skill: 'System Design',
          answer_outline: 'Explain system goals, key technologies, trade-offs, and metrics achieved.',
          follow_up_questions: ['What was the biggest technical bottleneck you faced?']
        },
        {
          question: `Explain how indexing works in relational databases and how you would optimize a slow query.`,
          category: 'technical_fundamentals',
          difficulty: 'medium',
          why_relevant: 'Tests database schema design and querying depth.',
          related_skill: 'SQL',
          answer_outline: 'Discuss B-trees, composite indexes, query execution plans, and EXPLAIN ANALYZE.',
          follow_up_questions: ['When would a database choose a sequential scan over an index scan?']
        }
      ];
    }

    // 5. Delete existing if regenerating
    if (regenerate) {
      await client.from('interview_questions').delete().eq('analysis_id', analysisId);
    }

    // 6. Insert into interview_questions
    const rowsToInsert = generatedQuestions.map((q) => ({
      id: crypto.randomUUID(),
      analysis_id: analysisId,
      user_id: userId,
      question: q.question,
      category: q.category || 'technical_fundamentals',
      difficulty: q.difficulty || 'medium',
      why_relevant: q.why_relevant || '',
      related_skill: q.related_skill || '',
      answer_outline: q.answer_outline || '',
      follow_up_questions: q.follow_up_questions || []
    }));

    const { data: savedRows } = await client
      .from('interview_questions')
      .insert(rowsToInsert)
      .select('*');

    return sendSuccess(req, res, savedRows || rowsToInsert);
  } catch (err) {
    next(err);
  }
}

export async function getOrGenerateRoadmap(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const { regenerate = false } = req.body || {};
    const client = req.supabase || getServiceClient();
    const aiProvider = getAIProvider();

    // 1. Verify parent analysis
    const { data: analysis, error: aErr } = await client
      .from('analyses')
      .select('id, status, title')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (aErr || !analysis) {
      return next(new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND'));
    }

    // 2. Return cached roadmap
    if (!regenerate) {
      const { data: cached } = await client
        .from('learning_roadmaps')
        .select('*')
        .eq('analysis_id', analysisId)
        .maybeSingle();

      if (cached && cached.roadmap && cached.roadmap.length > 0) {
        return sendSuccess(req, res, cached.roadmap);
      }
    }

    // 3. Fetch missing/partial skills ordered by priority
    const { data: matches } = await client
      .from('analysis_skill_matches')
      .select('skill_name, status, jd_importance, weight, priority_rank')
      .eq('analysis_id', analysisId)
      .in('status', ['missing', 'partially_matched'])
      .order('priority_rank', { ascending: false });

    const gaps = matches || [];

    // 4. Generate structured, dependency-ordered roadmap
    let roadmapSteps = gaps.map((gap, index) => ({
      step_number: index + 1,
      skill_name: gap.skill_name,
      priority: gap.jd_importance === 'required' ? 'High' : 'Medium',
      reason: `Required by job description (${gap.weight} pts).`,
      suggested_sequence: `Step ${index + 1}`,
      practice_task: `Build a mini-application or module demonstrating ${gap.skill_name}.`,
      expected_outcome: `Working GitHub repository and practical ability to answer interview deep-dives on ${gap.skill_name}.`,
      estimated_effort: '1–2 weeks (self-paced practice)',
      effort_disclaimer: 'Learning pace depends on prior background; estimates are non-guaranteed.'
    }));

    if (roadmapSteps.length === 0) {
      roadmapSteps = [
        {
          step_number: 1,
          skill_name: 'Interview Deep-Dive Refinement',
          priority: 'High',
          reason: 'Your resume shows strong initial coverage for required skills.',
          suggested_sequence: 'Step 1',
          practice_task: 'Conduct mock interviews focusing on system design trade-offs and project metrics.',
          expected_outcome: 'Crisp articulation of past project architectures under pressure.',
          estimated_effort: '1 week',
          effort_disclaimer: 'Estimates are informational guidance.'
        }
      ];
    }

    // 5. Upsert into learning_roadmaps
    await client
      .from('learning_roadmaps')
      .upsert({
        analysis_id: analysisId,
        user_id: userId,
        roadmap: roadmapSteps
      }, { onConflict: 'analysis_id' });

    return sendSuccess(req, res, roadmapSteps);
  } catch (err) {
    next(err);
  }
}

export async function getOrGenerateResumeSuggestions(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const { regenerate = false } = req.body || {};
    const client = req.supabase || getServiceClient();

    const { data: analysis } = await client
      .from('analyses')
      .select('id, resume_id, job_description_id, status, title, analysis_result')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (!analysis) {
      return next(new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND'));
    }

    // 1. Return cached suggestions unless regenerate: true or cache contains legacy templated text
    if (!regenerate && Array.isArray(analysis?.analysis_result?.recommendations) && analysis.analysis_result.recommendations.length > 0) {
      const isOldTemplated = analysis.analysis_result.recommendations.some(
        (r) => (r.suggestion && r.suggestion.includes('Quantify measurable impact for')) ||
               (r.suggestion && r.suggestion.includes('Build a concrete portfolio project incorporating'))
      );
      if (!isOldTemplated) {
        return sendSuccess(req, res, analysis.analysis_result.recommendations);
      }
    }

    // 2. Fetch matched skills, resume profile (projects, experience), and JD
    const [matchesRes, profileRes, jdRes] = await Promise.all([
      client.from('analysis_skill_matches')
        .select('skill_name, status, jd_importance, weight, resume_evidence')
        .eq('analysis_id', analysisId),
      client.from('resume_profiles')
        .select('parsed_data')
        .eq('resume_id', analysis.resume_id)
        .maybeSingle(),
      analysis.job_description_id
        ? client.from('job_descriptions').select('title, company, description').eq('id', analysis.job_description_id).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    const projects = profileRes.data?.parsed_data?.projects || [];
    const experience = profileRes.data?.parsed_data?.experience || [];
    const jdInfo = jdRes.data || {};
    const skillMatches = matchesRes.data || [];
    const aiProvider = getAIProvider();

    // 3. Grounded generation with project-level quote resolution and domain catalog fallback
    const suggestions = await generateResumeSuggestionsWithAI({
      aiProvider,
      analysis,
      jobDescription: jdInfo,
      projects,
      experience,
      skillMatches
    });

    // 4. Cache non-templated suggestions in analysis_result.recommendations for fast subsequent loads
    try {
      const updatedResult = {
        ...(analysis.analysis_result || {}),
        recommendations: suggestions
      };
      await client
        .from('analyses')
        .update({ analysis_result: updatedResult })
        .eq('id', analysisId);
    } catch (updateErr) {
      console.warn('[CacheSuggestionsWarning] Failed to update recommendations in analyses table:', updateErr.message);
    }

    return sendSuccess(req, res, suggestions);
  } catch (err) {
    next(err);
  }
}

/**
 * Feature 3: Evaluate Candidate Interview Answer (STAR Method + Technical Depth)
 */
export async function evaluateInterviewAnswer(req, res, next) {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;
    const { question, category, difficulty, candidateAnswer } = req.body || {};
    const client = req.supabase || getServiceClient();

    if (!question || typeof question !== 'string') {
      return next(new AppError('Interview question is required.', 400, 'INVALID_INPUT'));
    }

    if (!candidateAnswer || typeof candidateAnswer !== 'string' || !candidateAnswer.trim()) {
      return next(new AppError('Candidate answer is required.', 400, 'EMPTY_ANSWER'));
    }

    const { data: analysis } = await client
      .from('analyses')
      .select('id, title, status')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (!analysis) {
      return next(new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND'));
    }

    const aiProvider = getAIProvider();

    const evaluation = await evaluateCandidateAnswer({
      aiProvider,
      question,
      category,
      difficulty,
      candidateAnswer,
      roleTitle: analysis.title || 'Software Engineer'
    });

    return sendSuccess(req, res, evaluation);
  } catch (err) {
    next(err);
  }
}
