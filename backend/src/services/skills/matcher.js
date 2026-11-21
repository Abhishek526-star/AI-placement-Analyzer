import { normalizeSkill, CANONICAL_SKILLS_DICTIONARY } from './normalizer.js';

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

    // 2. Fallback search in raw resume text (checking canonical name & aliases)
    const dictEntry = CANONICAL_SKILLS_DICTIONARY.find(
      (s) => s.canonical_name.toLowerCase() === canonicalNameLower
    );

    let foundInText = false;
    let foundTerm = normalizedReq.canonical_name;

    const regex = new RegExp(`\\b${normalizedReq.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerRawText)) {
      foundInText = true;
    } else if (dictEntry && dictEntry.aliases) {
      for (const alias of dictEntry.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.+]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(lowerRawText)) {
          foundInText = true;
          foundTerm = alias;
          break;
        }
      }
    }

    if (foundInText) {
      return {
        requirement_id: req.id,
        skill_name: req.skill_name,
        canonical_name: normalizedReq.canonical_name,
        jd_importance: req.importance,
        weight: Number(req.weight) || 10.0,
        status: 'matched',
        score_multiplier: 1.0,
        confidence: 0.90,
        resume_evidence: [
          {
            section: 'general',
            quote: `Mentioned in resume: "${foundTerm}"`
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
    // Non-Equivalent Boundary Guard: Never partially match Java with JavaScript
    const isJavaVsJs = (canonicalNameLower === 'java' && normalizedResumeSkills.some((s) => s.normalized.canonical_name === 'JavaScript')) ||
                       (canonicalNameLower === 'javascript' && normalizedResumeSkills.some((s) => s.normalized.canonical_name === 'Java'));

    const relatedSkill = !isJavaVsJs
      ? normalizedResumeSkills.find(
          (rs) =>
            rs.normalized.category === normalizedReq.category &&
            normalizedReq.category !== 'Other' &&
            normalizedReq.category !== 'Programming Language' // Don't falsely cross-match languages
        )
      : null;

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
