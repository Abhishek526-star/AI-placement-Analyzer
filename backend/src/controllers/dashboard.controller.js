import { sendSuccess } from '../utils/response.js';
import { getServiceClient } from '../config/supabase.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();

    // 1. Fetch total analyses count and recent analyses
    const [analysesRes, resumesRes] = await Promise.all([
      client
        .from('analyses')
        .select('id, title, match_score, alignment_level, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      client
        .from('resumes')
        .select('id, filename, parsing_status, version, is_active, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const recentAnalyses = analysesRes.data || [];
    const activeResume = resumesRes.data || null;

    let skillsCount = 0;
    if (activeResume) {
      const { count } = await client
        .from('resume_skills')
        .select('*', { count: 'exact', head: true })
        .eq('resume_id', activeResume.id);
      skillsCount = count || 0;
    }

    // 2. Fetch top matched and top gap skills from latest analysis
    let topMatchedSkills = [];
    let topSkillGaps = [];

    if (recentAnalyses.length > 0) {
      const latestId = recentAnalyses[0].id;
      const { data: matches } = await client
        .from('analysis_skill_matches')
        .select('skill_name, status, jd_importance')
        .eq('analysis_id', latestId);

      if (matches) {
        topMatchedSkills = matches
          .filter((m) => m.status === 'matched')
          .map((m) => m.skill_name)
          .slice(0, 5);

        topSkillGaps = matches
          .filter((m) => m.status === 'missing' || m.status === 'partially_matched')
          .map((m) => m.skill_name)
          .slice(0, 5);
      }
    }

    return sendSuccess(req, res, {
      total_analyses: recentAnalyses.length,
      active_resume: activeResume ? { ...activeResume, skills_count: skillsCount } : null,
      latest_analysis: recentAnalyses[0] || null,
      top_matched_skills: topMatchedSkills,
      top_skill_gaps: topSkillGaps,
      recent_analyses: recentAnalyses
    });
  } catch (err) {
    next(err);
  }
}
