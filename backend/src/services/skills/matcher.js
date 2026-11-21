import { normalizeSkill } from './normalizer.js';

export function matchSkills(resumeSkills = [], rawResumeText = '', jobRequirements = []) {
  const normalizedResumeSkills = resumeSkills.map((rs) => ({
    ...rs,
    normalized: normalizeSkill(rs.skill_name)
  }));

  const lowerRawText = (rawResumeText || '').toLowerCase();

  return jobRequirements.map((req) => {
    const normalizedReq = normalizeSkill(req.skill_name);
    const reqNameLower = req.skill_name.toLowerCase();
    const canonicalNameLower = normalizedReq.canonical_name.toLowerCase();

    // 1. Direct match in resume_skills (exact or canonical match)
    const matchedSkill = normalizedResumeSkills.find(
      (rs) =>
        rs.skill_name.toLowerCase() === reqNameLower ||
        rs.normalized.canonical_name.toLowerCase() === canonicalNameLower
    );

    if (matchedSkill) {
      return {
        requirement_id: req.id,
        skill_name: req.skill_name,
        canonical_name: normalizedReq.canonical_name,
        jd_importance: req.importance,
        weight: Number(req.weight) || 10.0,
        status: 'matched',
        score_multiplier: 1.0,
        confidence: 0.98,
        resume_evidence: [
          {
            section: matchedSkill.section || 'skills',
            quote: matchedSkill.evidence_text || `Demonstrated ${matchedSkill.skill_name} in resume`
          }
        ],
        jd_evidence: [
          {
            quote: req.evidence_text || `Requires ${req.skill_name}`
          }
        ],
        explanation: `Candidate demonstrates verified experience with ${normalizedReq.canonical_name}.`
      };
    }

    // 2. Fallback text search in raw resume text
    const regex = new RegExp(`\\b${normalizedReq.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerRawText)) {
      return {
        requirement_id: req.id,
        skill_name: req.skill_name,
        canonical_name: normalizedReq.canonical_name,
        jd_importance: req.importance,
        weight: Number(req.weight) || 10.0,
        status: 'matched',
        score_multiplier: 1.0,
        confidence: 0.88,
        resume_evidence: [
          {
            section: 'general',
            quote: `Mentioned in resume: "${normalizedReq.canonical_name}"`
          }
        ],
        jd_evidence: [
          {
            quote: req.evidence_text || `Requires ${req.skill_name}`
          }
        ],
        explanation: `Found mention of ${normalizedReq.canonical_name} in candidate resume text.`
      };
    }

    // 3. Partial match check (same category or related framework)
    const relatedSkill = normalizedResumeSkills.find(
      (rs) => rs.normalized.category === normalizedReq.category && normalizedReq.category !== 'Other'
    );

    if (relatedSkill) {
      return {
        requirement_id: req.id,
        skill_name: req.skill_name,
        canonical_name: normalizedReq.canonical_name,
        jd_importance: req.importance,
        weight: Number(req.weight) || 10.0,
        status: 'partially_matched',
        score_multiplier: 0.5,
        confidence: 0.70,
        resume_evidence: [
          {
            section: relatedSkill.section || 'skills',
            quote: `Related ${relatedSkill.normalized.category} experience with ${relatedSkill.skill_name}`
          }
        ],
        jd_evidence: [
          {
            quote: req.evidence_text || `Requires ${req.skill_name}`
          }
        ],
        explanation: `Candidate has related background in ${relatedSkill.normalized.category} (${relatedSkill.skill_name}), but lacks direct evidence for ${normalizedReq.canonical_name}.`
      };
    }

    // 4. Missing skill (No evidence found)
    return {
      requirement_id: req.id,
      skill_name: req.skill_name,
      canonical_name: normalizedReq.canonical_name,
      jd_importance: req.importance,
      weight: Number(req.weight) || 10.0,
      status: 'missing',
      score_multiplier: 0.0,
      confidence: 0.95,
      resume_evidence: [],
      jd_evidence: [
        {
          quote: req.evidence_text || `Requires ${req.skill_name}`
        }
      ],
      explanation: `No evidence found in resume for ${normalizedReq.canonical_name}. Recommended as a priority learning gap.`
    };
  });
}
