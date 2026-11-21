import crypto from 'crypto';

/**
 * PII Minimization (PRD Section 13 & Security Architecture):
 * Redacts personal email, phone numbers, and addresses from chunk text
 * before embedding or sending to LLMs.
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
    // Redact international and standard phone numbers
    .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED]')
    // Redact street address indicators
    .replace(/\b\d{1,5}\s+([a-zA-Z]+\s+){1,3}(street|st|avenue|ave|road|rd|lane|ln|drive|dr|blvd)\b/gi, '[ADDRESS REDACTED]');
}

/**
 * Section-Aware Resume Chunker (PRD Section 8 & RAG Architecture):
 * Splits resume into coherent, bounded blocks (target: 350-450 tokens ~ 1200-1600 chars)
 * by section/role/project rather than naive arbitrary character slicing.
 */
export function chunkResume(rawText, options = {}) {
  const { documentId, userId } = options;
  const sanitized = redactPII(rawText);
  const lines = sanitized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const sectionHeaders = {
    summary: /^(summary|professional summary|objective|about me)$/i,
    skills: /^(skills|technical skills|technologies|tools)$/i,
    experience: /^(experience|work experience|employment history|internships)$/i,
    projects: /^(projects|personal projects|academic projects)$/i,
    education: /^(education|academic background|qualifications)$/i,
    certifications: /^(certifications|licenses|achievements)$/i
  };

  const chunks = [];
  let currentSection = 'summary';
  let currentLines = [];
  let chunkIndex = 0;

  const flushChunk = (section, entityName = '') => {
    if (currentLines.length === 0) return;
    const chunkText = currentLines.join('\n').trim();
    if (chunkText.length > 20) {
      chunks.push({
        id: crypto.randomUUID(),
        document_id: documentId,
        user_id: userId,
        document_type: 'resume',
        section,
        chunk_index: chunkIndex++,
        page_number: 1,
        chunk_text: chunkText,
        metadata: {
          section,
          entity_name: entityName || section,
          char_length: chunkText.length
        }
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    let matchedHeader = false;
    for (const [sec, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
        flushChunk(currentSection);
        currentSection = sec;
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader) {
      currentLines.push(line);
      // If single section block exceeds ~400 tokens (1600 chars), flush chunk with slight overlap
      if (currentLines.join('\n').length > 1500) {
        flushChunk(currentSection);
      }
    }
  }

  flushChunk(currentSection);

  return chunks;
}

/**
 * Job Description Chunker:
 * Splits JD into logical requirement blocks (target: 250-350 tokens ~ 800-1200 chars).
 */
export function chunkJobDescription(rawText, options = {}) {
  const { documentId, userId } = options;
  const sanitized = redactPII(rawText);
  const lines = sanitized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const chunks = [];
  let currentBlock = [];
  let chunkIndex = 0;

  for (const line of lines) {
    currentBlock.push(line);
    if (currentBlock.join('\n').length > 1000) {
      const chunkText = currentBlock.join('\n').trim();
      chunks.push({
        id: crypto.randomUUID(),
        document_id: documentId,
        user_id: userId,
        document_type: 'job_description',
        section: 'requirements',
        chunk_index: chunkIndex++,
        page_number: 1,
        chunk_text: chunkText,
        metadata: {
          section: 'requirements',
          char_length: chunkText.length
        }
      });
      currentBlock = [];
    }
  }

  if (currentBlock.length > 0) {
    const chunkText = currentBlock.join('\n').trim();
    chunks.push({
      id: crypto.randomUUID(),
      document_id: documentId,
      user_id: userId,
      document_type: 'job_description',
      section: 'requirements',
      chunk_index: chunkIndex++,
      page_number: 1,
      chunk_text: chunkText,
      metadata: {
        section: 'requirements',
        char_length: chunkText.length
      }
    });
  }

  return chunks;
}
