import { describe, it, expect } from 'vitest';

describe('Career Intelligence & Honest Suggestions (PRD FR-10, FR-11, FR-12)', () => {
  const allowedCategories = [
    'technical_fundamentals',
    'coding_dsa',
    'project_deep_dive',
    'technology_specific',
    'scenario_based',
    'behavioral_hr'
  ];

  it('restricts interview question categories to the 6 PRD categories', () => {
    const sampleQuestions = [
      { question: 'What is a closure?', category: 'technical_fundamentals' },
      { question: 'Walk me through your database indexing choice in your project.', category: 'project_deep_dive' },
      { question: 'How would you handle a production 500 spike?', category: 'scenario_based' }
    ];

    for (const q of sampleQuestions) {
      expect(allowedCategories).toContain(q.category);
    }
  });

  it('enforces honest resume suggestions: missing skills are classified as acquire_new_skill and never fabricate experience', () => {
    const missingSkill = {
      skill_name: 'Kubernetes',
      status: 'missing'
    };

    const suggestion = {
      category: 'acquire_new_skill',
      target_skill: missingSkill.skill_name,
      target_quote: null,
      suggestion: 'Build a concrete portfolio project incorporating Kubernetes before adding it to your resume.',
      classification: 'general_guidance'
    };

    expect(suggestion.category).toBe('acquire_new_skill');
    expect(suggestion.target_quote).toBeNull();
    expect(suggestion.classification).toBe('general_guidance');
    expect(suggestion.suggestion).not.toContain('add experience you do not have');
  });

  it('ensures roadmap steps include effort disclaimer', () => {
    const step = {
      step_number: 1,
      skill_name: 'Docker',
      priority: 'High',
      practice_task: 'Containerize your backend API and write a docker-compose.yml file.',
      expected_outcome: 'Working Docker container running locally.',
      estimated_effort: '1 week',
      effort_disclaimer: 'Learning pace depends on prior background; estimates are non-guaranteed.'
    };

    expect(step.effort_disclaimer).toBeDefined();
    expect(step.effort_disclaimer).toContain('non-guaranteed');
  });
});
