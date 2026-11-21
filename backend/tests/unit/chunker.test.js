import { describe, it, expect } from 'vitest';
import { redactPII, chunkResume, chunkJobDescription } from '../../src/services/rag/chunker.js';

describe('PII Redaction Engine (PRD Section 13 & Security Architecture)', () => {
  it('redacts email addresses, phone numbers, and street addresses', () => {
    const raw = `
John Doe
Contact: john.doe@example.com or jdoe_99@college.edu
Phone: +1 (555) 234-5678 or 9876543210
Address: 123 Innovation Boulevard, Tech City
    `;

    const redacted = redactPII(raw);

    expect(redacted).not.toContain('john.doe@example.com');
    expect(redacted).not.toContain('555');
    expect(redacted).toContain('[EMAIL REDACTED]');
    expect(redacted).toContain('[PHONE REDACTED]');
  });
});

describe('Section-Aware Chunker (PRD Section 8 & RAG Architecture)', () => {
  const sampleResume = `
Aarav Sharma
aarav@example.com

SUMMARY
Passionate frontend developer experienced with React and modern UI architectures.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python
Frameworks: React, Next.js, Node.js
Databases: PostgreSQL, Redis

PROJECTS
AI Placement Analyzer
Built a full-stack career platform with React, Node.js, and pgvector. Implemented deterministic skill matching.

EDUCATION
Bachelor of Technology in Computer Science
XYZ Institute, 2026
  `;

  it('splits resume into coherent section-based chunks with metadata', () => {
    const chunks = chunkResume(sampleResume, {
      documentId: 'doc_123',
      userId: 'usr_456'
    });

    expect(chunks.length).toBeGreaterThan(0);

    const sections = chunks.map((c) => c.section);
    expect(sections).toContain('skills');
    expect(sections).toContain('projects');

    for (const c of chunks) {
      expect(c.document_id).toBe('doc_123');
      expect(c.user_id).toBe('usr_456');
      expect(c.document_type).toBe('resume');
      expect(c.chunk_text.length).toBeGreaterThan(10);
      expect(c.chunk_text).not.toContain('aarav@example.com'); // PII redacted
    }
  });

  it('chunks job descriptions into requirement blocks', () => {
    const jdText = `
Role: Senior Frontend Developer at Acme Corp
Location: Remote

Responsibilities:
- Build accessible, high-performance web applications using React and TypeScript.
- Collaborate with backend teams on REST API design.

Qualifications:
- 3+ years experience with React, Node.js, and PostgreSQL.
- Experience with Docker and AWS is preferred.
    `;

    const chunks = chunkJobDescription(jdText, {
      documentId: 'jd_789',
      userId: 'usr_456'
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].document_type).toBe('job_description');
  });
});
