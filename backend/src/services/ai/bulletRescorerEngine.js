import { normalizeSkill, CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';
import { calculateMatchScore } from '../skills/scorer.js';

/**
 * Live Resume Bullet Re-Scorer Engine (PRD FR-08, FR-12, Platform Feature 2)
 * Simulates real-time ATS match score delta and newly verified skills when a bullet is edited.
 */
export function simulateBulletRescore({
  currentMatches = [],
  updatedBullet = '',
  originalBullet = ''
}) {
  const bulletTrimmed = (updatedBullet || '').trim();
  const lowerBullet = bulletTrimmed.toLowerCase();

  // 1. Detect Quantified Metrics in the Bullet
  const metricRegex = /\b\d+(\.\d+)?%|\b\d+\+?\s*(ms|fps|sku|skus|users|requests|endpoints|queries|stars|commits|rps)\b|\bsub-\d+ms\b|\b\d+x\b/gi;
  const detectedMetrics = bulletTrimmed.match(metricRegex) || [];

  // 2. Identify skills mentioned in the updated bullet
  const matchedSkillsInBullet = [];

  for (const match of currentMatches) {
    const norm = normalizeSkill(match.skill_name);
    const canonicalLower = norm.canonical_name.toLowerCase();
    const skillLower = match.skill_name.toLowerCase();

    // Check direct mention or alias match
    let found = false;
    const directRegex = new RegExp(`\\b${norm.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (directRegex.test(bulletTrimmed)) {
      found = true;
    } else {
      const dictEntry = CANONICAL_SKILLS_DICTIONARY.find(
        (d) => d.canonical_name.toLowerCase() === canonicalLower
      );
      if (dictEntry?.aliases) {
        for (const alias of dictEntry.aliases) {
          const aliasRegex = new RegExp(`\\b${alias.replace(/[.+]/g, '\\$&')}\\b`, 'i');
          if (aliasRegex.test(bulletTrimmed)) {
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      matchedSkillsInBullet.push({
        skill_name: match.skill_name,
        canonical_name: norm.canonical_name,
        previous_status: match.status,
        weight: match.weight
      });
    }
  }

  // 3. Create simulated match list
  const simulatedMatches = currentMatches.map((m) => {
    const isFoundInNewBullet = matchedSkillsInBullet.some((s) => s.skill_name === m.skill_name);
    if (isFoundInNewBullet && m.status !== 'matched') {
      return {
        ...m,
        status: 'matched',
        score_multiplier: 1.0,
        simulated_upgrade: true
      };
    }
    return { ...m };
  });

  // 4. Calculate Scores
  const currentScoreResult = calculateMatchScore(currentMatches);
  const simulatedScoreResult = calculateMatchScore(simulatedMatches);

  const newlyMatchedSkills = simulatedMatches.filter((m) => m.simulated_upgrade);
  const scoreDelta = Math.round((simulatedScoreResult.match_score - currentScoreResult.match_score) * 10) / 10;

  // 5. Senior Engineering Bullet Assessment
  const wordCount = bulletTrimmed.split(/\s+/).filter(Boolean).length;
  const hasActionVerb = /^(architected|engineered|built|designed|implemented|developed|optimized|containerized|deployed|automated|refactored)\b/i.test(bulletTrimmed);
  const hasQuantifiedMetric = detectedMetrics.length > 0;

  let qualityGrade = 'developing';
  if (hasActionVerb && hasQuantifiedMetric && wordCount >= 12) {
    qualityGrade = 'executive_sde';
  } else if (hasActionVerb || hasQuantifiedMetric) {
    qualityGrade = 'strong';
  }

  return {
    current_match_score: currentScoreResult.match_score,
    simulated_match_score: simulatedScoreResult.match_score,
    score_delta: scoreDelta,
    alignment_level: simulatedScoreResult.alignment_level,
    detected_metrics: detectedMetrics,
    newly_matched_skills: newlyMatchedSkills.map((s) => ({
      skill_name: s.skill_name,
      previous_status: s.previous_status,
      weight: s.weight,
      added_points: s.previous_status === 'partially_matched' ? s.weight * 0.5 : s.weight
    })),
    bullet_quality: {
      grade: qualityGrade,
      has_action_verb: hasActionVerb,
      has_quantified_metric: hasQuantifiedMetric,
      word_count: wordCount,
      feedback: qualityGrade === 'executive_sde'
        ? 'Outstanding! Starts with an active engineering verb, details architecture patterns, and quantifies business/system impact.'
        : !hasActionVerb
        ? 'Tip: Begin with a strong active verb like "Architected", "Engineered", or "Optimized".'
        : 'Tip: Include a measurable metric such as latency reduction (e.g. "sub-80ms"), throughput, or scale (e.g. "200+ SKU").'
    }
  };
}
