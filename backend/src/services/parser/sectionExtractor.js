import { CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';

export function extractSectionsAndProfile(rawText, options = {}) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Contact Extraction
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  
  // International & Indian Phone Number regex (handles +91-6387104522, 6387104522, (555) 123-4567, etc.)
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}|\+?\d{1,3}[-.\s]?\d{10}/);

  // GitHub & LinkedIn detection: check rawText first
  let githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i) ||
    rawText.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);

  let linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i) ||
    rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);

  // Fallback: If links are embedded as PDF URI annotations, scan rawBuffer if provided
  if ((!githubMatch || !linkedinMatch) && options.rawBuffer) {
    try {
      const bufferStr = options.rawBuffer.toString('latin1');
      if (!githubMatch) {
        const ghBuf = bufferStr.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i);
        if (ghBuf) githubMatch = ghBuf;
      }
      if (!linkedinMatch) {
        const liBuf = bufferStr.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);
        if (liBuf) linkedinMatch = liBuf;
      }
    } catch {
      // Ignore buffer scanning errors
    }
  }

  // Candidate Name extraction: clean out phone, email, and labels from line 0
  let candidateName = '';
  if (lines.length > 0) {
    let rawNameLine = lines[0];
    // Strip phone numbers and labels
    rawNameLine = rawNameLine.replace(/(?:phone|mob|mobile|tel|contact)?\s*[:\-]?\s*(\+?\d[\d\s\-]{8,}\d)/i, '');
    // Strip emails
    rawNameLine = rawNameLine.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    // Strip URLs
    rawNameLine = rawNameLine.replace(/https?:\/\/\S+/g, '');
    // Strip trailing delimiters
    rawNameLine = rawNameLine.replace(/[|\-•,]+$/, '').trim();
    candidateName = rawNameLine.slice(0, 80);
  }

  // 2. Section Heading Matchers (handles colons, casing, bullet points)
  const sectionHeaders = {
    summary: /^(?:[•\-\*]?\s*)?(?:summary|professional\s+summary|objective|about\s+me)\s*:?$/i,
    skills: /^(?:[•\-\*]?\s*)?(?:skills|technical\s+skills|technologies|core\s+competencies|tools)\s*:?$/i,
    experience: /^(?:[•\-\*]?\s*)?(?:experience|work\s+experience|employment\s+history|internships?|internship\s+experience)\s*:?$/i,
    projects: /^(?:[•\-\*]?\s*)?(?:projects|personal\s+projects|academic\s+projects|key\s+projects)\s*:?$/i,
    education: /^(?:[•\-\*]?\s*)?(?:education|academic\s+background|qualifications)\s*:?$/i,
    certifications: /^(?:[•\-\*]?\s*)?(?:certifications?|licenses|courses|achievements?)\s*:?$/i
  };

  let currentSection = 'header';
  const sectionTextBlocks = {
    header: [],
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

  // 3. Multi-Item Education Extractor
  const educationList = [];
  if (sectionTextBlocks.education && sectionTextBlocks.education.length > 0) {
    const eduLines = sectionTextBlocks.education;
    let currentEdu = null;

    for (const line of eduLines) {
      const isBulletOrNewSchool =
        line.startsWith('•') ||
        line.startsWith('-') ||
        /^(?:bachelor|master|b\.tech|m\.tech|class\s+[x|v|i]+|high\s+school|secondary|diploma)/i.test(line) ||
        /\b(?:university|college|institute|vidyalaya|school)\b/i.test(line);

      // Extract years (e.g. 2023 - 2027, 2021, 2019)
      const yearMatch = line.match(/\b(19\d{2}|20\d{2})\s*(?:–|-|to)?\s*(19\d{2}|20\d{2})?\b/);

      if (isBulletOrNewSchool && (currentEdu === null || line.startsWith('•') || yearMatch)) {
        if (currentEdu) {
          educationList.push(currentEdu);
        }
        currentEdu = {
          degree: '',
          institution: '',
          graduation_year: yearMatch ? (yearMatch[2] ? `${yearMatch[1]} – ${yearMatch[2]}` : yearMatch[1]) : '2026',
          score: ''
        };

        // Clean line of bullet and years
        let cleanLine = line.replace(/^[•\-\*]\s*/, '').replace(/\b(19\d{2}|20\d{2})\s*(?:–|-|to)?\s*(19\d{2}|20\d{2})?\b/, '').trim();
        if (/\b(?:university|college|institute|vidyalaya|school)\b/i.test(cleanLine)) {
          currentEdu.institution = cleanLine;
        } else {
          currentEdu.degree = cleanLine;
        }
      } else if (currentEdu) {
        // Check for CGPA or percentage
        const scoreMatch = line.match(/(?:cgpa|percentage|gpa|score)\s*[:\-]?\s*(\d+(?:\.\d+)?%?)/i);
        if (scoreMatch) {
          currentEdu.score = scoreMatch[0];
        }

        if (!currentEdu.degree) {
          currentEdu.degree = line.replace(/(?:cgpa|percentage|gpa|score)\s*[:\-]?\s*(\d+(?:\.\d+)?%?)/i, '').trim();
        } else if (!currentEdu.institution) {
          currentEdu.institution = line;
        }
      }
    }

    if (currentEdu) {
      educationList.push(currentEdu);
    }
  }

  // 4. Multi-Item Experience Extractor
  const experienceList = [];
  if (sectionTextBlocks.experience && sectionTextBlocks.experience.length > 0) {
    const expLines = sectionTextBlocks.experience;
    let currentExp = null;

    for (const line of expLines) {
      const isNewExp = line.startsWith('•') || line.startsWith('*');
      if (isNewExp) {
        if (currentExp) {
          experienceList.push(currentExp);
        }
        // Extract duration/date if present in line
        const dateMatch = line.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i);
        const cleanCompany = line.replace(/^[•\-\*]\s*/, '').replace(dateMatch ? dateMatch[0] : '', '').trim();

        currentExp = {
          company: cleanCompany || 'Company / Organization',
          role: '',
          duration: dateMatch ? dateMatch[0] : '',
          description: []
        };
      } else if (currentExp) {
        if (!currentExp.role && !line.startsWith('–') && !line.startsWith('-')) {
          currentExp.role = line;
        } else {
          currentExp.description.push(line.replace(/^[–\-\*•]\s*/, ''));
        }
      }
    }

    if (currentExp) {
      experienceList.push({
        ...currentExp,
        description: currentExp.description.join(' ')
      });
    }
  }

  // 5. Multi-Item Projects Extractor
  const projectsList = [];
  if (sectionTextBlocks.projects && sectionTextBlocks.projects.length > 0) {
    const projLines = sectionTextBlocks.projects;
    let currentProj = null;

    for (const line of projLines) {
      const isNewProj = line.startsWith('•') || line.startsWith('*');
      if (isNewProj) {
        if (currentProj) {
          projectsList.push({
            ...currentProj,
            description: Array.isArray(currentProj.description) ? currentProj.description.join(' ') : currentProj.description
          });
        }
        // Extract project name, clean out [Link], dates
        const dateMatch = line.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i);
        let cleanTitle = line
          .replace(/^[•\-\*]\s*/, '')
          .replace(/\[link\]/i, '')
          .replace(dateMatch ? dateMatch[0] : '', '')
          .trim();

        currentProj = {
          name: cleanTitle || 'Featured Project',
          description: [],
          technologies: []
        };
      } else if (currentProj) {
        const cleanDesc = line.replace(/^[–\-\*•]\s*/, '');
        currentProj.description.push(cleanDesc);

        // Detect technologies in project description
        for (const skill of CANONICAL_SKILLS_DICTIONARY) {
          const rx = new RegExp(`\\b${skill.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
          if (rx.test(line) && !currentProj.technologies.includes(skill.canonical_name)) {
            currentProj.technologies.push(skill.canonical_name);
          }
        }
      }
    }

    if (currentProj) {
      projectsList.push({
        ...currentProj,
        description: currentProj.description.join(' ')
      });
    }
  }

  // 6. Direct Skills Section Parsing & Canonical Matching
  const detectedSkillsMap = new Map();
  const normalizedText = rawText.toLowerCase();

  // (A) Check direct Skills Section category lines (e.g. "Languages: C, C++, JavaScript...")
  if (sectionTextBlocks.skills && sectionTextBlocks.skills.length > 0) {
    for (const line of sectionTextBlocks.skills) {
      // If line contains colon like "Languages: C, C++, ..."
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const items = line.slice(colonIndex + 1).split(/[,|/]/).map((s) => s.trim()).filter(Boolean);
        for (const rawItem of items) {
          // Match against dictionary or keep canonical
          const matchedCanonical = CANONICAL_SKILLS_DICTIONARY.find(
            (c) =>
              c.canonical_name.toLowerCase() === rawItem.toLowerCase() ||
              c.aliases.includes(rawItem.toLowerCase())
          );
          const skillName = matchedCanonical ? matchedCanonical.canonical_name : rawItem;
          detectedSkillsMap.set(skillName.toLowerCase(), {
            skill_name: skillName,
            section: 'skills',
            evidence_text: line.slice(0, 250),
            confidence: 0.98
          });
        }
      }
    }
  }

  // (B) Global Scan using Canonical Dictionary across the entire document
  for (const skill of CANONICAL_SKILLS_DICTIONARY) {
    const canonicalRegex = new RegExp(`\\b${skill.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    let matched = canonicalRegex.test(normalizedText);
    let matchedAlias = skill.canonical_name;

    if (!matched) {
      for (const alias of skill.aliases) {
        // Special guard for single-letter "C"
        const boundary = alias.length === 1 ? `\\b${alias}\\b` : `\\b${alias.replace(/[.+]/g, '\\$&')}\\b`;
        const aliasRegex = new RegExp(boundary, 'i');
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

      if (!detectedSkillsMap.has(skill.canonical_name.toLowerCase())) {
        detectedSkillsMap.set(skill.canonical_name.toLowerCase(), {
          skill_name: skill.canonical_name,
          section: sectionTextBlocks.skills && sectionTextBlocks.skills.some((l) => matchRegex.test(l)) ? 'skills' : 'projects',
          evidence_text: evidenceLine.slice(0, 250),
          confidence: 0.95
        });
      }
    }
  }

  const detectedSkills = Array.from(detectedSkillsMap.values());

  const contactData = {
    full_name: candidateName,
    email: emailMatch ? emailMatch[1] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    github: githubMatch ? githubMatch[0] : ''
  };

  return {
    parsed_data: {
      contact: contactData,
      education: educationList,
      experience: experienceList,
      projects: projectsList,
      certifications: sectionTextBlocks.certifications || []
    },
    skills: detectedSkills,
    extraction_confidence: detectedSkills.length > 5 ? 0.95 : 0.8
  };
}
