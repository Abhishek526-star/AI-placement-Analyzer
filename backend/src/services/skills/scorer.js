/**
 * Computes deterministic match score using PRD FR-08 formula:
 * Match Score = (Sum of earned weighted scores / Sum of all weighted requirements) * 100
 */
export function calculateMatchScore(skillMatches = []) {
  if (!skillMatches || skillMatches.length === 0) {
    return {
      match_score: 0.0,
      alignment_level: 'low',
      score_breakdown: {
        total_weight: 0,
        earned_weight: 0,
        matched_count: 0,
        partial_count: 0,
        missing_count: 0
      },
      ranked_matches: []
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  let matchedCount = 0;
  let partialCount = 0;
  let missingCount = 0;

  for (const match of skillMatches) {
    const weight = Number(match.weight) || 10.0;
    const earned = weight * (match.score_multiplier !== undefined ? match.score_multiplier : (
      match.status === 'matched' ? 1.0 : match.status === 'partially_matched' ? 0.5 : 0.0
    ));

    totalWeight += weight;
    earnedWeight += earned;

    if (match.status === 'matched') matchedCount++;
    else if (match.status === 'partially_matched') partialCount++;
    else missingCount++;
  }

  const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0.0;
  const match_score = Math.round(rawScore * 10) / 10; // Round to 1 decimal place

  // Alignment level mapping (FR-08)
  let alignment_level = 'low';
  if (match_score >= 80.0) alignment_level = 'strong';
  else if (match_score >= 60.0) alignment_level = 'moderate';
  else if (match_score >= 40.0) alignment_level = 'partial';

  // Priority ranking for gaps: required missing > required partial > preferred missing > preferred partial
  const ranked_matches = skillMatches
    .map((m) => {
      let priorityScore = 0;
      if (m.jd_importance === 'required') priorityScore += 100;
      else priorityScore += 50;

      if (m.status === 'missing') priorityScore += 20;
      else if (m.status === 'partially_matched') priorityScore += 10;
      else priorityScore += 0;

      priorityScore += Number(m.weight) || 10;

      return {
        ...m,
        score: Number(m.weight) * (m.score_multiplier || (m.status === 'matched' ? 1.0 : m.status === 'partially_matched' ? 0.5 : 0.0)),
        priority_rank: priorityScore
      };
    })
    .sort((a, b) => b.priority_rank - a.priority_rank);

  return {
    match_score,
    alignment_level,
    score_breakdown: {
      total_weight: totalWeight,
      earned_weight: Math.round(earnedWeight * 10) / 10,
      matched_count: matchedCount,
      partial_count: partialCount,
      missing_count: missingCount
    },
    ranked_matches
  };
}
