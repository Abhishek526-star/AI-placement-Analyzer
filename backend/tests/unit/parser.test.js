import { describe, it, expect } from 'vitest';
import { validateFileBuffer } from '../../src/services/parser/magicBytes.js';
import { extractSectionsAndProfile } from '../../src/services/parser/sectionExtractor.js';

describe('Magic-Byte File Validator (PRD FR-02 & Security)', () => {
  it('accepts valid PDF magic bytes (%PDF-)', () => {
    const validPdfBuffer = Buffer.from('%PDF-1.7\nSample PDF text content for testing.');
    const result = validateFileBuffer(validPdfBuffer, 'resume.pdf');

    expect(result.fileType).toBe('pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.hash).toBeDefined();
  });

  it('accepts valid DOCX magic bytes (PK\\x03\\x04)', () => {
    const validDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00]);
    const result = validateFileBuffer(validDocxBuffer, 'resume.docx');

    expect(result.fileType).toBe('docx');
    expect(result.mimeType).toContain('wordprocessingml');
  });

  it('rejects spoofed file (PNG binary with .pdf extension)', () => {
    const fakePngPdf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(() => validateFileBuffer(fakePngPdf, 'malicious.pdf')).toThrowError(/PDF and DOCX/);
  });

  it('rejects empty 0-byte buffer', () => {
    expect(() => validateFileBuffer(Buffer.alloc(0), 'empty.pdf')).toThrowError(/empty or corrupted/);
  });

  it('rejects oversized file (>10 MB)', () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    expect(() => validateFileBuffer(largeBuffer, 'huge.pdf')).toThrowError(/10 MB/);
  });
});

describe('Section & Skill Extractor (PRD FR-03)', () => {
  const sampleResume = `
Aarav Sharma
aarav@example.com | (555) 123-4567 | linkedin.com/in/aarav-sharma | github.com/aaravsharma

EDUCATION
Bachelor of Technology in Computer Science
XYZ Institute of Technology, 2026

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, C++, SQL
Frameworks & Libraries: React, Node.js, Express.js, Tailwind CSS
Databases & Cloud: PostgreSQL, MongoDB, Docker, AWS

PROJECTS
AI Placement Analyzer
Engineered a full-stack platform using React, Node.js, and PostgreSQL. Integrated Docker and AWS deployment.
  `;

  it('extracts candidate contact details', () => {
    const { parsed_data } = extractSectionsAndProfile(sampleResume);

    expect(parsed_data.contact.email).toBe('aarav@example.com');
    expect(parsed_data.contact.github).toBe('github.com/aaravsharma');
    expect(parsed_data.contact.linkedin).toBe('linkedin.com/in/aarav-sharma');
  });

  it('detects technical skills with confidence and evidence', () => {
    const { skills, extraction_confidence } = extractSectionsAndProfile(sampleResume);

    const skillNames = skills.map((s) => s.skill_name);
    expect(skillNames).toContain('JavaScript');
    expect(skillNames).toContain('React');
    expect(skillNames).toContain('Node.js');
    expect(skillNames).toContain('PostgreSQL');
    expect(extraction_confidence).toBeGreaterThan(0.8);
  });
});
