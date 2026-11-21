import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from '../../src/services/skills/scorer.js';
import { matchSkills } from '../../src/services/skills/matcher.js';

describe('Deterministic Scorer (PRD FR-08 & ADR-01)', () => {
  it('calculates the PRD Section 7 example case correctly (score = 65.0, alignment = moderate)', () => {
    // PRD example:
    // React (20, Matched) = 20
    // Node.js (20, Matched) = 20
    // Java (20, Missing) = 0
    // SQL (15, Matched) = 15
    // Spring Boot (15, Missing) = 0
    // Git (10, Matched) = 10
    // Total Weight = 100, Earned = 65 -> Score = 65.0
    const matches = [
      { skill_name: 'React', weight: 20, status: 'matched', jd_importance: 'required' },
      { skill_name: 'Node.js', weight: 20, status: 'matched', jd_importance: 'required' },
      { skill_name: 'Java', weight: 20, status: 'missing', jd_importance: 'required' },
      { skill_name: 'SQL', weight: 15, status: 'matched', jd_importance: 'required' },
      { skill_name: 'Spring Boot', weight: 15, status: 'missing', jd_importance: 'required' },
      { skill_name: 'Git', weight: 10, status: 'matched', jd_importance: 'required' }
    ];

    const { match_score, alignment_level, score_breakdown } = calculateMatchScore(matches);

    expect(match_score).toBe(65.0);
    expect(alignment_level).toBe('moderate');
    expect(score_breakdown.total_weight).toBe(100);
    expect(score_breakdown.earned_weight).toBe(65.0);
    expect(score_breakdown.matched_count).toBe(4);
    expect(score_breakdown.missing_count).toBe(2);
  });

  it('maps boundary alignment labels deterministically', () => {
    // 80.0 -> strong
    expect(calculateMatchScore([{ skill_name: 'React', weight: 10, status: 'matched', score_multiplier: 0.8 }]).alignment_level).toBe('strong');
    // 60.0 -> moderate
    expect(calculateMatchScore([{ skill_name: 'React', weight: 10, status: 'matched', score_multiplier: 0.6 }]).alignment_level).toBe('moderate');
    // 40.0 -> partial
    expect(calculateMatchScore([{ skill_name: 'React', weight: 10, status: 'matched', score_multiplier: 0.4 }]).alignment_level).toBe('partial');
    // 20.0 -> low
    expect(calculateMatchScore([{ skill_name: 'React', weight: 10, status: 'matched', score_multiplier: 0.2 }]).alignment_level).toBe('low');
  });

  it('is byte-for-byte reproducible on identical inputs', () => {
    const matches = [
      { skill_name: 'TypeScript', weight: 20, status: 'matched' },
      { skill_name: 'Docker', weight: 10, status: 'partially_matched' }
    ];

    const run1 = calculateMatchScore(matches);
    const run2 = calculateMatchScore(matches);

    expect(run1).toEqual(run2);
  });
});
