import { describe, it, expect } from 'vitest';
import { validateFileBuffer } from '../../src/services/parser/magicBytes.js';
import { extractSectionsAndProfile } from '../../src/services/parser/sectionExtractor.js';
import { parsePdf } from '../../src/services/parser/pdfParser.js';

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

  it('cleanses candidate name with icons and delimiters cleanly', () => {
    const headerResume = `Abhishek Kumar# abhishekkumar@example.com — ï LinkedIn — § GitHub
EDUCATION
Madan Mohan Malaviya University of Technology Gorakhpur, U.P.
B.Tech in Computer Science and Engineering (CGPA: 8.33 / 10.0) Sep 2023 – May 2027
EXPERIENCE
Bharat Electronics Limited - CRL Ghaziabad June 2025 – July 2025
Web Developer Intern Ghaziabad
• Developed an interactive 3D metro station model using Three.js.
• Implemented drag-and-drop functionality for dynamic station placement.
PROJECTS
Pharma Plus — React.js, Node.js, Express.js, MongoDB (GitHub · Demo) July 2026
• Built a full-stack MERN pharmacy platform with medicine search and cart.
• Implemented JWT authentication with bcrypt password hashing.
Expense Manager — React.js, Node.js (GitHub · Demo) June 2026
• Developed a full-stack expense management app with JWT.
TECHNICAL SKILLS
– Programming Languages: C, C++, JavaScript, Python, SQL`;

    const { parsed_data } = extractSectionsAndProfile(headerResume);

    expect(parsed_data.contact.full_name).toBe('Abhishek Kumar');
    expect(parsed_data.education.length).toBe(1);
    expect(parsed_data.education[0].institution).toContain('Madan Mohan Malaviya');
    expect(parsed_data.education[0].degree).toContain('B.Tech in Computer Science');
    expect(parsed_data.education[0].score).toBe('CGPA: 8.33 / 10.0');
    expect(parsed_data.education[0].graduation_year).toBe('Sep 2023 – May 2027');

    expect(parsed_data.experience.length).toBe(1);
    expect(parsed_data.experience[0].company).toContain('Bharat Electronics Limited');
    expect(parsed_data.experience[0].role).toContain('Web Developer Intern');
    expect(parsed_data.experience[0].bullets.length).toBe(2);

    expect(parsed_data.projects.length).toBe(2);
    expect(parsed_data.projects[0].name).toBe('Pharma Plus');
    expect(parsed_data.projects[0].duration).toBe('July 2026');
    expect(parsed_data.projects[0].bullets.length).toBe(2);
    expect(parsed_data.projects[1].name).toBe('Expense Manager');
    expect(parsed_data.projects[1].duration).toBe('June 2026');
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

describe('PDF Parser Service (PRD FR-02 & Section 16)', () => {
  const validPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
100 700 Td
(Software Engineer with hands-on proficiency in JavaScript, React, Node.js, and PostgreSQL database systems.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000416 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
496
%%EOF`;

  it('parses valid text-based PDF and extracts text and page count', async () => {
    const buffer = Buffer.from(validPdfContent);
    const result = await parsePdf(buffer);

    expect(result.text).toContain('Software Engineer with hands-on proficiency');
    expect(result.text).toContain('React');
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('detects scanned / image-only PDF (< 50 chars) and throws SCANNED_PDF_UNREADABLE', async () => {
    // PDF with only short text (< 50 chars)
    const shortPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 25 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hi) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000321 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
401
%%EOF`;

    const buffer = Buffer.from(shortPdfContent);
    await expect(parsePdf(buffer)).rejects.toThrowError(/scanned or contains no readable text/);
  });

  it('rejects corrupted PDF data with EMPTY_OR_CORRUPT_FILE', async () => {
    const corruptBuffer = Buffer.from('%PDF-1.4\nCorrupted binary payload that is not valid PDF');
    await expect(parsePdf(corruptBuffer)).rejects.toThrowError(/Failed to parse PDF document/);
  });
});
