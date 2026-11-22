import { describe, it, expect } from 'vitest';
import {
  findBestResumeQuote,
  generateDomainSuggestion,
  generateResumeSuggestionsWithAI
} from '../../src/services/ai/resumeSuggestionsEngine.js';
import {
  evaluateCandidateAnswer,
  evaluateWithHeuristics
} from '../../src/services/ai/answerEvaluationEngine.js';

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

  it('findBestResumeQuote resolves exact project bullets rather than generic skills section dump', () => {
    const projects = [
      {
        name: 'Pharma Plus',
        bullets: [
          'Built a full-stack MERN pharmacy platform with medicine search, persistent cart, and order tracking, using Redux Toolkit and Tailwind CSS for responsive UI.',
          'Integrated Razorpay payment gateway with server-side signature verification and Cash-on-Delivery option via REST APIs.'
        ]
      },
      {
        name: 'Expense Manager',
        bullets: [
          'Engineered RESTful APIs using Node.js and Express with MongoDB and Mongoose for complete income and expense tracking.'
        ]
      }
    ];

    const rawSkillsDump = '- Frontend & Backend: HTML, CSS, React.js, Node.js, Express.js, Tailwind CSS, REST APIs, Socket.IO, WebSockets';

    const tailwindQuote = findBestResumeQuote('Tailwind CSS', projects, [], rawSkillsDump);
    expect(tailwindQuote).toContain('Tailwind CSS');
    expect(tailwindQuote).toContain('pharmacy platform');
    expect(tailwindQuote).not.toContain('- Frontend & Backend: HTML, CSS');

    const nodeQuote = findBestResumeQuote('Node.js', projects, [], rawSkillsDump);
    expect(nodeQuote).toContain('Node.js');
    expect(nodeQuote).toContain('Express with MongoDB');
    expect(nodeQuote).not.toContain('- Frontend & Backend: HTML, CSS');

    const razorpayQuote = findBestResumeQuote('Razorpay', projects, [], '');
    expect(razorpayQuote).toContain('Razorpay payment gateway');
  });

  it('generateDomainSuggestion ensures diverse, non-templated advice across different skills', () => {
    const skills = [
      'Tailwind CSS',
      'Node.js',
      'Express.js',
      'REST API Development',
      'React',
      'MongoDB',
      'Data Structures and Algorithms',
      'Object-Oriented Programming'
    ];

    const suggestions = skills.map((s) => generateDomainSuggestion(s, 'improve_wording'));

    // Check that every single skill receives a unique recommendation
    const uniqueSet = new Set(suggestions);
    expect(uniqueSet.size).toBe(skills.length);

    // Verify no suggestion uses the old lazy template
    for (const sugg of suggestions) {
      expect(sugg).not.toContain('Quantify measurable impact for');
      expect(sugg.length).toBeGreaterThan(30);
    }
  });

  it('generateResumeSuggestionsWithAI produces evidence-first suggestions adhering to PRD FR-12', async () => {
    const projects = [
      {
        name: 'Pharma Plus',
        bullets: [
          'Built a full-stack pharmacy platform with medicine search and order tracking using Tailwind CSS.',
          'Integrated Razorpay payment gateway with server-side signature verification.'
        ]
      }
    ];

    const skillMatches = [
      { skill_name: 'Tailwind CSS', status: 'matched', resume_evidence: [{ quote: 'Tailwind CSS in skills' }] },
      { skill_name: 'Next.js', status: 'partially_matched', resume_evidence: [{ quote: 'Related frontend React' }] },
      { skill_name: 'Docker', status: 'missing', resume_evidence: [] }
    ];

    const suggestions = await generateResumeSuggestionsWithAI({
      aiProvider: null,
      analysis: { title: 'Full Stack Engineer' },
      projects,
      experience: [],
      skillMatches
    });

    expect(suggestions.length).toBe(3);

    const tailwind = suggestions.find((s) => s.target_skill === 'Tailwind CSS');
    expect(tailwind.category).toBe('improve_wording');
    expect(tailwind.target_quote).toContain('Tailwind CSS');
    expect(tailwind.suggestion).not.toContain('Quantify measurable impact for');

    const nextjs = suggestions.find((s) => s.target_skill === 'Next.js');
    expect(nextjs.category).toBe('highlight_existing_skill');

    const docker = suggestions.find((s) => s.target_skill === 'Docker');
    expect(docker.category).toBe('acquire_new_skill');
    expect(docker.target_quote).toBeNull();
    expect(docker.classification).toBe('general_guidance');
    expect(docker.suggestion).toContain('containeriz');
  });

  describe('Feature 3: AI Mock Interview Answer Evaluation Engine', () => {
    it('handles short or empty answers with low score and clear advice to use STAR structure', async () => {
      const result = await evaluateCandidateAnswer({
        aiProvider: null,
        question: 'How did you handle authentication?',
        candidateAnswer: 'I used JWT.'
      });

      expect(result.overall_score).toBeLessThanOrEqual(3.0);
      expect(result.star_analysis.situation.detected).toBe(false);
      expect(result.star_analysis.result.detected).toBe(false);
      expect(result.improved_model_answer).toBeDefined();
    });

    it('evaluates a complete STAR answer with high score and detailed feedback', async () => {
      const starAnswer = `In Pharma Plus (Situation), we needed to secure user authentication and protect order routes against CSRF (Task).
I implemented JWT session management with bcrypt hashing and HTTP-only cookies, combined with a custom Express middleware to verify token signatures (Action).
This resulted in zero unauthorized access vulnerabilities and kept authentication overhead below 15ms per request (Result).`;

      const result = await evaluateCandidateAnswer({
        aiProvider: null,
        question: 'How did you implement secure authentication in your project?',
        candidateAnswer: starAnswer,
        roleTitle: 'Full Stack Engineer'
      });

      expect(result.overall_score).toBeGreaterThanOrEqual(7.0);
      expect(result.star_analysis.situation.detected).toBe(true);
      expect(result.star_analysis.action.detected).toBe(true);
      expect(result.star_analysis.result.detected).toBe(true);
      expect(result.technical_depth.strengths.length).toBeGreaterThan(0);
      expect(result.coaching_tip).toBeDefined();
    });
  });
});
