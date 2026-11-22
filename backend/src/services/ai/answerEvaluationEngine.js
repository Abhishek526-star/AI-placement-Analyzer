/**
 * Answer Evaluation Engine (PRD FR-10, Platform Feature 3)
 * Evaluates candidate responses to interview questions using:
 * 1. AI-powered evaluation with strict STAR method parsing
 * 2. Deterministic heuristic fallback when Gemini API is rate-limited or offline
 */

export async function evaluateCandidateAnswer({
  aiProvider,
  question,
  category = 'technical_fundamentals',
  difficulty = 'medium',
  candidateAnswer = '',
  roleTitle = 'Software Engineer'
}) {
  const trimmedAnswer = (candidateAnswer || '').trim();
  const wordCount = trimmedAnswer.split(/\s+/).filter(Boolean).length;

  if (!trimmedAnswer || trimmedAnswer.length < 25 || wordCount < 5) {
    return {
      overall_score: 2.0,
      summary: 'Your response was too brief for an engineering interview evaluation. Aim for at least 3-4 structured sentences.',
      star_analysis: {
        situation: { detected: false, feedback: 'No background or context provided.' },
        task: { detected: false, feedback: 'No clear problem statement or objective stated.' },
        action: { detected: false, feedback: 'No specific engineering tools or steps described.' },
        result: { detected: false, feedback: 'No outcome or measurable impact included.' }
      },
      technical_depth: {
        score: 2.0,
        strengths: [],
        missing_concepts: ['Context establishment', 'Technical implementation details', 'Quantified outcome']
      },
      improved_model_answer: `When faced with this in a production application (Situation), our objective was to ensure optimal system performance and reliability (Task). I engineered the solution using industry-standard patterns and robust error handling (Action), resulting in zero downtime and improved latency (Result).`,
      coaching_tip: 'Always structure technical interview answers with the STAR method: Context -> Objective -> Technical Action -> Result.'
    };
  }

  // 1. Try Gemini AI Evaluation
  if (aiProvider && typeof aiProvider.generateStructuredJSON === 'function') {
    try {
      const systemPrompt = `You are a Principal Software Engineering Interviewer evaluating a candidate's verbal/written answer to a technical interview question.
Target Role: ${roleTitle}
Question Category: ${category}
Difficulty: ${difficulty}

Evaluate the candidate's answer using the STAR method (Situation, Task, Action, Result) and Technical Depth.
Be constructive, honest, and high-standard.

Return ONLY a JSON object with this exact structure:
{
  "overall_score": 7.5, // float 1.0 - 10.0
  "summary": "Concise 1-2 sentence executive summary of the answer's quality.",
  "star_analysis": {
    "situation": { "detected": true, "feedback": "Brief feedback on context/setting" },
    "task": { "detected": true, "feedback": "Brief feedback on challenge/goal" },
    "action": { "detected": true, "feedback": "Brief feedback on technical decisions and actions" },
    "result": { "detected": false, "feedback": "Brief feedback on outcome/metrics" }
  },
  "technical_depth": {
    "score": 7.0, // float 1.0 - 10.0
    "strengths": ["string", "string"],
    "missing_concepts": ["string", "string"]
  },
  "improved_model_answer": "A compelling, senior-level model answer articulating the same experience using the STAR method.",
  "coaching_tip": "One high-leverage piece of advice to make this answer stand out to hiring managers."
}`;

      const userPrompt = `Interview Question: "${question}"
Candidate's Response:
"${trimmedAnswer}"

Please evaluate this response.`;

      const aiResult = await aiProvider.generateStructuredJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.2
      });

      if (aiResult && typeof aiResult.overall_score === 'number') {
        return aiResult;
      }
    } catch (aiErr) {
      console.warn('[AnswerEvaluationEngine] AI provider evaluation failed or rate limited, switching to heuristic fallback:', aiErr.message);
    }
  }

  // 2. Deterministic Heuristic Fallback Engine
  return evaluateWithHeuristics({ question, category, difficulty, answer: trimmedAnswer, roleTitle });
}

export function evaluateWithHeuristics({ question, category, difficulty, answer, roleTitle }) {
  const lower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  // Detect STAR signals
  const hasSituation = /(situation|when|in [a-z0-9\s_-]+|while working|at [a-z0-9\s_-]+|during|context|scenario|faced with|production|our system|in my project)/i.test(lower);
  const hasTask = /(task|goal|objective|needed to|had to|aimed to|requirement|challenge|problem)/i.test(lower);
  const hasAction = /(action|implemented|built|engineered|configured|designed|refactored|used|utilized|optimized|migrated|created|integrated|applied)/i.test(lower);
  const hasResult = /(result|resulted|achieved|reduced|improved|increased|decreased|ensured|prevented|latency|%|fps|ms|scale|users|zero downtime)/i.test(lower);

  // Compute STAR score
  const starSignalsCount = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;

  // Technical keywords detection
  const techTerms = [
    'react', 'node', 'express', 'mongodb', 'sql', 'jwt', 'bcrypt', 'docker',
    'three.js', 'redis', 'api', 'rest', 'redux', 'hook', 'cache', 'query',
    'index', 'token', 'auth', 'schema', 'performance', 'latency', 'concurrency'
  ];
  const matchedTechTerms = techTerms.filter((term) => lower.includes(term));

  // Base score calculation
  let baseScore = 4.0;
  if (wordCount > 40) baseScore += 1.5;
  if (wordCount > 80) baseScore += 1.0;
  baseScore += starSignalsCount * 0.75;
  if (matchedTechTerms.length >= 2) baseScore += 0.8;

  // Cap score between 1.0 and 9.2 (10 is reserved for flawless answers)
  const finalScore = Math.min(9.2, Math.max(3.0, Math.round(baseScore * 10) / 10));

  const strengths = [];
  if (hasAction) strengths.push('Directly articulated technical implementation steps and tools.');
  if (hasResult) strengths.push('Included tangible outcomes and system performance impact.');
  if (matchedTechTerms.length > 0) strengths.push(`Referenced concrete technologies (${matchedTechTerms.slice(0, 3).join(', ')}).`);
  if (strengths.length === 0) strengths.push('Communicated core idea clearly.');

  const missingConcepts = [];
  if (!hasSituation) missingConcepts.push('Initial context or production scale (Situation)');
  if (!hasTask) missingConcepts.push('Specific engineering objective or trade-off (Task)');
  if (!hasResult) missingConcepts.push('Measurable outcome or metric improvement (Result)');
  if (missingConcepts.length === 0) missingConcepts.push('Edge case handling and error recovery patterns');

  return {
    overall_score: finalScore,
    summary: finalScore >= 7.5
      ? 'Strong technical response with good structure and relevant engineering terminology.'
      : 'Solid start, but could be elevated by adopting a clearer STAR framework and quantifying measurable outcomes.',
    star_analysis: {
      situation: {
        detected: hasSituation,
        feedback: hasSituation
          ? 'Clear background context established.'
          : 'Consider framing the context first (e.g., "In my pharmacy application when handling order traffic...").'
      },
      task: {
        detected: hasTask,
        feedback: hasTask
          ? 'Explicit engineering goal or challenge identified.'
          : 'Define the explicit engineering challenge or constraint you needed to solve.'
      },
      action: {
        detected: hasAction,
        feedback: hasAction
          ? 'Demonstrated proactive technical decision-making and tool selection.'
          : 'Specify the exact architectural decisions, libraries, and design patterns you used.'
      },
      result: {
        detected: hasResult,
        feedback: hasResult
          ? 'Good mention of positive results or operational metrics.'
          : 'Quantify the outcome (e.g., "reducing query latency by 40%" or "ensuring 0 unauthorized access incidents").'
      }
    },
    technical_depth: {
      score: Math.min(9.0, Math.max(4.0, finalScore - 0.5)),
      strengths,
      missing_concepts: missingConcepts
    },
    improved_model_answer: `In my project (Situation), our objective was to resolve this reliability and scale challenge under peak user traffic (Task). I engineered the solution using ${matchedTechTerms.length > 0 ? matchedTechTerms.slice(0, 2).join(' and ') : 'modular architecture'}, applying defensive validation and strict indexing (Action), which eliminated runtime crashes and achieved sub-100ms response times (Result).`,
    coaching_tip: 'When speaking with tech leads, always emphasize WHY you chose a specific technology over alternatives, followed by the measurable impact.'
  };
}
