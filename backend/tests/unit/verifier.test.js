import { describe, it, expect } from 'vitest';
import { verifyAndCleanAIOutput } from '../../src/services/ai/verifier.js';

describe('3-Stage Citation & Hallucination Verifier (ADR-04 & PRD Section 8)', () => {
  const validChunkId = 'chunk_uuid_101';
  const suppliedChunks = [
    {
      id: validChunkId,
      section: 'projects',
      chunk_text: 'Developed a high-performance analytics dashboard using React and Tailwind CSS with sub-100ms state updates.'
    }
  ];

  it('accepts valid citations with verbatim quotes', () => {
    const rawOutput = {
      summary: {
        role: 'Frontend Engineer',
        overall_alignment: 'strong',
        strengths: ['Strong React foundation'],
        limitations: []
      },
      skill_analysis: [
        {
          skill: 'React',
          status: 'matched',
          confidence: 0.95,
          resume_evidence: [
            {
              chunk_id: validChunkId,
              quote: 'Developed a high-performance analytics dashboard using React'
            }
          ],
          explanation: 'Demonstrated in analytics dashboard project.'
        }
      ],
      recommendations: []
    };

    const result = verifyAndCleanAIOutput(rawOutput, suppliedChunks);

    expect(result.isValid).toBe(true);
    expect(result.repaired.skill_analysis[0].resume_evidence).toHaveLength(1);
    expect(result.repaired.skill_analysis[0].status).toBe('matched');
  });

  it('strips fabricated chunk_ids not present in context and downgrades unsupported claims', () => {
    const rawOutput = {
      summary: {
        role: 'Frontend Engineer',
        overall_alignment: 'moderate',
        strengths: [],
        limitations: []
      },
      skill_analysis: [
        {
          skill: 'Rust',
          status: 'matched',
          confidence: 0.9,
          resume_evidence: [
            {
              chunk_id: 'fabricated_fake_uuid_999', // Fabricated UUID!
              quote: 'Built microservices in Rust'
            }
          ],
          explanation: 'Candidate knows Rust.'
        }
      ],
      recommendations: []
    };

    const result = verifyAndCleanAIOutput(rawOutput, suppliedChunks);

    expect(result.isValid).toBe(true);
    // Fabricated citation stripped
    expect(result.repaired.skill_analysis[0].resume_evidence).toHaveLength(0);
    // Downgrade guard in action: matched without evidence -> uncertain!
    expect(result.repaired.skill_analysis[0].status).toBe('uncertain');
    expect(result.repaired.summary.limitations[0]).toContain('downgraded to uncertain');
  });

  it('strips fabricated quotes that do not appear in the referenced chunk text', () => {
    const rawOutput = {
      summary: {
        role: 'Frontend Engineer',
        overall_alignment: 'moderate',
        strengths: [],
        limitations: []
      },
      skill_analysis: [
        {
          skill: 'React',
          status: 'matched',
          confidence: 0.9,
          resume_evidence: [
            {
              chunk_id: validChunkId, // Valid chunk ID, but fabricated quote!
              quote: 'Led a team of 50 developers to build Kubernetes clusters from scratch.'
            }
          ],
          explanation: 'Candidate claim.'
        }
      ],
      recommendations: []
    };

    const result = verifyAndCleanAIOutput(rawOutput, suppliedChunks);

    expect(result.isValid).toBe(true);
    expect(result.repaired.skill_analysis[0].resume_evidence).toHaveLength(0);
    expect(result.repaired.skill_analysis[0].status).toBe('uncertain');
  });
});
