import { AppError } from '../../middleware/errorHandler.js';
import { normalizeSkill, CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';

export function parseJobDescription(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
    throw new AppError(
      'The job description must be at least 50 characters long to extract requirements.',
      400,
      'JD_TOO_SHORT'
    );
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const sections = {
    required_skills: [],
    preferred_skills: [],
    responsibilities: [],
    experience_requirements: ''
  };

  const detectedRequirements = [];
  const lowerText = rawText.toLowerCase();

  // Check which canonical skills appear in the JD text
  for (const skill of CANONICAL_SKILLS_DICTIONARY) {
    // Regex boundary match
    const regex = new RegExp(`\\b${skill.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    let matched = regex.test(lowerText);

    if (!matched) {
      for (const alias of skill.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.+]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(lowerText)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      // Find line excerpt for evidence
      const excerptLine = lines.find((l) => regex.test(l)) || `Requirement: ${skill.canonical_name}`;

      // Determine importance (required vs preferred)
      const isPreferred = /preferred|nice to have|plus|bonus|optional/i.test(excerptLine);
      const importance = isPreferred ? 'preferred' : 'required';
      const weight = isPreferred ? 10.0 : 20.0;

      detectedRequirements.push({
        skill_name: skill.canonical_name,
        importance,
        requirement_type: 'technical_skill',
        weight,
        evidence_text: excerptLine.slice(0, 250)
      });

      if (isPreferred) {
        sections.preferred_skills.push(skill.canonical_name);
      } else {
        sections.required_skills.push(skill.canonical_name);
      }
    }
  }

  // Detect experience requirement heuristic
  const expMatch = rawText.match(/(\d+\+?\s*(-|\s*to\s*)\s*\d+\s*(years?|yrs?)|freshers?|entry level)/i);
  if (expMatch) {
    sections.experience_requirements = expMatch[0];
  } else {
    sections.experience_requirements = 'Not explicitly specified';
  }

  return {
    parsed_data: sections,
    requirements: detectedRequirements
  };
}
