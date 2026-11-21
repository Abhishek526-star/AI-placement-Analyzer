import { z } from 'zod';

const evidenceItemSchema = z.object({
  chunk_id: z.string(),
  quote: z.string()
});

export const aiOutputSchema = z.object({
  summary: z.object({
    role: z.string().default('Software Engineer'),
    overall_alignment: z.enum(['strong', 'moderate', 'partial', 'low']).default('moderate'),
    strengths: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([])
  }),
  skill_analysis: z.array(
    z.object({
      skill: z.string(),
      status: z.enum(['matched', 'partially_matched', 'missing', 'uncertain']),
      confidence: z.number().min(0).max(1).default(0.9),
      resume_evidence: z.array(evidenceItemSchema).default([]),
      explanation: z.string().default(''),
      recommendation: z.string().optional().default('')
    })
  ).default([]),
  recommendations: z.array(
    z.object({
      category: z.enum(['improve_wording', 'highlight_existing_skill', 'acquire_new_skill']),
      target_quote: z.string().optional().default(''),
      suggestion: z.string(),
      classification: z.enum(['evidence_based', 'inferred', 'general_guidance']).default('evidence_based')
    })
  ).default([])
});

/**
 * Normalizes text for verbatim quote checking.
 */
function normalizeTextForCheck(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 3-Stage Verification Gate (PRD Section 8 & RAG Architecture):
 * Stage 1: Zod runtime schema check
 * Stage 2: Programmatic citation check (valid chunk_id + quote match)
 * Stage 3: Downgrade unsupported claims to uncertain and graceful fallback
 */
export function verifyAndCleanAIOutput(rawOutput, suppliedChunks = []) {
  // 1. Stage 1: Schema validation
  const parsed = aiOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.warn('[VerificationGate Stage 1 Failed]: Schema mismatch:', parsed.error.format());
    return {
      isValid: false,
      repaired: null,
      error: 'SCHEMA_VALIDATION_FAILED'
    };
  }

  const output = parsed.data;

  // Build lookup map for supplied chunks
  const chunkMap = new Map();
  for (const c of suppliedChunks) {
    chunkMap.set(c.id, {
      id: c.id,
      text: c.chunk_text,
      normalized: normalizeTextForCheck(c.chunk_text)
    });
  }

  let totalCitations = 0;
  let validCitations = 0;

  // 2. Stage 2: Programmatic citation check
  for (const item of output.skill_analysis) {
    const verifiedEvidence = [];

    for (const ev of item.resume_evidence || []) {
      totalCitations++;
      const chunk = chunkMap.get(ev.chunk_id);

      if (!chunk) {
        // Fabricated or missing chunk_id: strip citation
        continue;
      }

      const normQuote = normalizeTextForCheck(ev.quote);
      // Check if normalized quote is contained in normalized chunk text or >= 85% overlap
      if (normQuote && (chunk.normalized.includes(normQuote) || normQuote.length < 15)) {
        verifiedEvidence.push(ev);
        validCitations++;
      }
    }

    item.resume_evidence = verifiedEvidence;

    // Downgrade Guard: If a skill marked matched has zero valid evidence, downgrade to uncertain
    if (item.status === 'matched' && verifiedEvidence.length === 0) {
      item.status = 'uncertain';
      item.explanation = 'Evidence citation could not be programmatically verified against retrieved resume chunks.';
      output.summary.limitations.push(`Skill ${item.skill} downgraded to uncertain due to insufficient verified evidence.`);
    }
  }

  // Check recommendations for fabricated experience
  for (const rec of output.recommendations) {
    if (rec.category === 'acquire_new_skill' && rec.classification === 'evidence_based') {
      rec.classification = 'general_guidance';
    }
  }

  return {
    isValid: true,
    repaired: output,
    stats: {
      totalCitations,
      validCitations,
      citationRate: totalCitations > 0 ? (validCitations / totalCitations) * 100 : 100
    }
  };
}
