import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

/**
 * AI Provider Abstraction (PRD Section 10 & ADR-04):
 * Separates LLM & embedding operations behind an interface so models can be swapped
 * or mocked during unit/integration tests without touching pipeline logic.
 */
class GeminiProvider {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.embeddingModels = [
      process.env.GEMINI_EMBEDDING_MODEL,
      'gemini-embedding-001',
      'gemini-embedding-2'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    this.textModels = [
      process.env.GEMINI_CHAT_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);
  }

  /**
   * Generates a 768-dimensional embedding vector with automatic model cascade.
   * taskType: 'RETRIEVAL_DOCUMENT' (for indexing) | 'RETRIEVAL_QUERY' (for search)
   */
  async generateEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
    let lastError = null;

    for (const model of this.embeddingModels) {
      try {
        const response = await this.ai.models.embedContent({
          model,
          contents: text,
          config: {
            taskType,
            outputDimensionality: 768
          }
        });

        const values = response.embedding?.values || response.embeddings?.[0]?.values;
        if (values && values.length > 0) {
          return values.slice(0, 768);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiEmbeddingCascade] Model ${model} failed (${err.message}). Trying next candidate...`);
      }
    }

    console.warn('[GeminiEmbeddingError] All models failed, falling back to zero-vector:', lastError?.message);
    return Array(768).fill(0.001);
  }

  async generateEmbeddingsBatch(texts, taskType = 'RETRIEVAL_DOCUMENT') {
    return Promise.all(texts.map((t) => this.generateEmbedding(t, taskType)));
  }

  /**
   * Generates structured JSON adhering to the supplied schema at low temperature.
   * Cascades through backup models on 503 (high demand) or 429 (rate limit).
   */
  async generateStructuredJSON({ systemPrompt, userPrompt, temperature = 0.1 }) {
    let lastError = null;

    for (const model of this.textModels) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            temperature,
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text?.trim() || '{}';
        return JSON.parse(rawText);
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiCascade] Model ${model} unavailable (${err.message}). Cascading to next backup model...`);
      }
    }

    console.warn('[GeminiGenerateError] All candidate models exhausted:', lastError?.message);
    throw lastError;
  }
}

/**
 * Deterministic Mock AI Provider for offline unit tests and dev mode without Gemini API key.
 */
class MockAIProvider {
  async generateEmbedding(text, _taskType = 'RETRIEVAL_DOCUMENT') {
    // Generate deterministic 768-dim vector from text hash
    const vector = Array(768).fill(0.005);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    vector[0] = Math.abs(hash % 100) / 100;
    return vector;
  }

  async generateEmbeddingsBatch(texts, taskType = 'RETRIEVAL_DOCUMENT') {
    return Promise.all(texts.map((t) => this.generateEmbedding(t, taskType)));
  }

  async generateStructuredJSON({ userPrompt }) {
    // Return grounded mock response for offline development
    return {
      summary: {
        role: 'Software Engineer',
        overall_alignment: 'moderate',
        strengths: ['Demonstrated strong core skills in candidate resume'],
        limitations: ['Certain preferred technical requirements are missing']
      },
      skill_analysis: [],
      recommendations: [
        {
          category: 'improve_wording',
          target_quote: 'Engineered a full-stack platform using React',
          suggestion: 'Quantify metrics such as latency reduction or active user count.',
          classification: 'evidence_based'
        }
      ],
      interview_questions: [],
      roadmap: []
    };
  }
}

let providerInstance = null;

export function getAIProvider() {
  if (!providerInstance) {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'dummy_gemini_api_key_for_dev') {
      providerInstance = new GeminiProvider(env.GEMINI_API_KEY);
    } else {
      providerInstance = new MockAIProvider();
    }
  }
  return providerInstance;
}
