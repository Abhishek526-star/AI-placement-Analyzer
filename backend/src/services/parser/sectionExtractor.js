import { CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';

export function extractSectionsAndProfile(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Heuristic Contact Extraction
  const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/i);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  const githubMatch = rawText.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);

  const candidateName = lines.length > 0 ? lines[0].slice(0, 80) : '';

  const sectionHeaders = {
    summary: /^(summary|professional summary|objective|about me)$/i,
    skills: /^(skills|technical skills|technologies|core competencies|tools)$/i,
    experience: /^(experience|work experience|employment history|internships|internship experience)$/i,
    projects: /^(projects|personal projects|academic projects|key projects)$/i,
    education: /^(education|academic background|qualifications)$/i,
    certifications: /^(certifications|licenses|courses|achievements)$/i
  };

  const sections = {
    contact: {
      full_name: candidateName,
      email: emailMatch ? emailMatch[1] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      linkedin: linkedinMatch ? linkedinMatch[1] : '',
      github: githubMatch ? githubMatch[1] : ''
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: []
  };

  let currentSection = 'summary';
  const sectionTextBlocks = {
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  for (const line of lines) {
    let matchedHeader = false;
    for (const [sec, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
        currentSection = sec;
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader) {
      if (!sectionTextBlocks[currentSection]) {
        sectionTextBlocks[currentSection] = [];
      }
      sectionTextBlocks[currentSection].push(line);
    }
  }

  // Detect skills using canonical dictionary + aliases
  const detectedSkills = [];
  const normalizedText = rawText.toLowerCase();

  for (const skill of CANONICAL_SKILLS_DICTIONARY) {
    // Check canonical name
    const canonicalRegex = new RegExp(`\\b${skill.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    let matched = canonicalRegex.test(normalizedText);
    let matchedAlias = skill.canonical_name;

    // Check aliases
    if (!matched) {
      for (const alias of skill.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.+]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(normalizedText)) {
          matched = true;
          matchedAlias = alias;
          break;
        }
      }
    }

    if (matched) {
      const matchRegex = new RegExp(`\\b${matchedAlias.replace(/[.+]/g, '\\$&')}\\b`, 'i');
      const evidenceLine = lines.find((l) => matchRegex.test(l)) || `Demonstrated knowledge of ${skill.canonical_name}`;
      
      detectedSkills.push({
        skill_name: skill.canonical_name,
        section: sectionTextBlocks.skills.some((l) => matchRegex.test(l)) ? 'skills' : 'projects',
        evidence_text: evidenceLine.slice(0, 250),
        confidence: 0.95
      });
    }
  }

  // Basic education parsing
  if (sectionTextBlocks.education.length > 0) {
    sections.education.push({
      degree: sectionTextBlocks.education[0] || 'Bachelor of Technology',
      institution: sectionTextBlocks.education[1] || 'University / Institute',
      graduation_year: 2026
    });
  }

  // Basic project parsing
  if (sectionTextBlocks.projects.length > 0) {
    const projectLines = sectionTextBlocks.projects;
    sections.projects.push({
      name: projectLines[0] || 'Featured Project',
      description: projectLines.slice(1, 4).join(' ') || 'Project detailed in resume.',
      technologies: detectedSkills.slice(0, 4).map((s) => s.skill_name)
    });
  }

  return {
    parsed_data: {
      contact: sections.contact,
      education: sections.education,
      experience: sections.experience,
      projects: sections.projects,
      certifications: sections.certifications
    },
    skills: detectedSkills,
    extraction_confidence: detectedSkills.length > 3 ? 0.92 : 0.75
  };
}
