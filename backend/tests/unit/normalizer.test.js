import { describe, it, expect } from 'vitest';
import { normalizeSkill } from '../../src/services/skills/normalizer.js';
import { parseJobDescription } from '../../src/services/parser/jdParser.js';

describe('Canonical Skill Normalizer (PRD FR-06 & ADR-02)', () => {
  it('maps common aliases to canonical names', () => {
    expect(normalizeSkill('JS').canonical_name).toBe('JavaScript');
    expect(normalizeSkill('Javascript').canonical_name).toBe('JavaScript');
    expect(normalizeSkill('ReactJS').canonical_name).toBe('React');
    expect(normalizeSkill('Node JS').canonical_name).toBe('Node.js');
    expect(normalizeSkill('Postgres').canonical_name).toBe('PostgreSQL');
    expect(normalizeSkill('Mongo').canonical_name).toBe('MongoDB');
    expect(normalizeSkill('RESTful API').canonical_name).toBe('REST API Development');
  });

  it('guarantees Java and JavaScript are never merged', () => {
    const javaResult = normalizeSkill('Java');
    const jsResult = normalizeSkill('JavaScript');

    expect(javaResult.canonical_name).toBe('Java');
    expect(jsResult.canonical_name).toBe('JavaScript');
    expect(javaResult.canonical_name).not.toBe(jsResult.canonical_name);
  });
});

describe('Job Description Parser (PRD FR-05)', () => {
  it('rejects JD shorter than 50 characters', () => {
    expect(() => parseJobDescription('Too short JD text')).toThrowError(/at least 50 characters/);
  });

  it('extracts required and preferred technical skills with weights', () => {
    const jdText = `
We are looking for a Senior Frontend Developer at Acme Corp.
Must have strong experience in React, TypeScript, and SQL.
Experience with Docker and AWS is preferred.
    `;

    const { parsed_data, requirements } = parseJobDescription(jdText);

    expect(parsed_data.required_skills).toContain('React');
    expect(parsed_data.required_skills).toContain('TypeScript');
    expect(parsed_data.preferred_skills).toContain('Docker');

    const reactReq = requirements.find((r) => r.skill_name === 'React');
    expect(reactReq).toBeDefined();
    expect(reactReq.importance).toBe('required');
    expect(reactReq.weight).toBe(20.0);

    const dockerReq = requirements.find((r) => r.skill_name === 'Docker');
    expect(dockerReq).toBeDefined();
    expect(dockerReq.importance).toBe('preferred');
    expect(dockerReq.weight).toBe(10.0);
  });
});
