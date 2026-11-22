import { CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';

export function extractSectionsAndProfile(rawText, options = {}) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Contact Extraction
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  
  // International & Indian Phone Number regex (handles +91-6387104522, 6387104522, (555) 123-4567, etc.)
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}|\+?\d{1,3}[-.\s]?\d{10}/);

  // Candidate Name extraction: clean out phone, email, symbols, and labels
  let candidateName = '';
  if (lines.length > 0) {
    let rawNameLine = lines[0];
    const segments = rawNameLine.split(/[#|•—–]/);
    let namePart = segments[0].trim();
    namePart = namePart.replace(/(?:phone|mob|mobile|tel|contact|email|roll\s*no)[\s:\-].*$/i, '').trim();
    namePart = namePart.replace(/[^a-zA-Z\s.'-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const words = namePart.split(' ').filter(Boolean);
    if (words.length >= 1 && words.length <= 5 && namePart.length >= 2) {
      candidateName = namePart;
    } else {
      candidateName = words.slice(0, 3).join(' ') || 'Candidate';
    }
  }

  // Links extraction: check options.links, options.rawBuffer, and rawText
  let githubUrl = '';
  let linkedinUrl = '';
  const allExtractedLinks = [];

  if (Array.isArray(options.links)) {
    for (const l of options.links) {
      if (l.url) allExtractedLinks.push(l.url);
    }
  }

  if (options.rawBuffer) {
    try {
      const bufferStr = options.rawBuffer.toString('latin1');
      const uriMatches = bufferStr.match(/\/URI\s*\(([^)]+)\)/g);
      if (uriMatches) {
        for (const u of uriMatches) {
          const cleanU = u.replace(/^\/URI\s*\(/, '').replace(/\)$/, '').trim();
          allExtractedLinks.push(cleanU);
        }
      }
    } catch {
      // Ignore buffer scanning errors
    }
  }

  const textUrls = rawText.match(/https?:\/\/[^\s\)\<\>"'\]]+/g);
  if (textUrls) {
    allExtractedLinks.push(...textUrls);
  }

  // Find LinkedIn profile URL
  const liMatch = allExtractedLinks.find((u) => /linkedin\.com\/in\/[a-zA-Z0-9_\-]+/i.test(u));
  if (liMatch) {
    linkedinUrl = liMatch;
  } else {
    const rawLi = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i) ||
                  rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);
    if (rawLi) linkedinUrl = rawLi[0];
  }

  // Find GitHub profile URL (distinguish candidate user profile from repositories)
  const ghProfileMatch = allExtractedLinks.find(
    (u) => /github\.com\/[a-zA-Z0-9_\-]+(?:\/)?$/i.test(u) && !/(?:pharma|expense|project|repo)/i.test(u)
  );
  if (ghProfileMatch) {
    githubUrl = ghProfileMatch;
  } else {
    const ghAny = allExtractedLinks.find((u) => /github\.com\/([a-zA-Z0-9_\-]+)/i.test(u));
    if (ghAny) {
      const user = ghAny.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
      if (user) githubUrl = `https://github.com/${user[1]}`;
    } else {
      const rawGh = rawText.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i) ||
                    rawText.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
      if (rawGh) githubUrl = rawGh[0];
    }
  }

  // 2. Section Heading Matchers (handles colons, casing, bullet points)
  const sectionHeaders = {
    summary: /^(?:[•\-\*]?\s*)?(?:summary|professional\s+summary|objective|about\s+me)\s*:?$/i,
    skills: /^(?:[•\-\*]?\s*)?(?:skills|technical\s+skills|technologies|core\s+competencies|tools)\s*:?$/i,
    experience: /^(?:[•\-\*]?\s*)?(?:experience|work\s+experience|employment\s+history|internships?|internship\s+experience)\s*:?$/i,
    projects: /^(?:[•\-\*]?\s*)?(?:projects|personal\s+projects|academic\s+projects|key\s+projects)\s*:?$/i,
    education: /^(?:[•\-\*]?\s*)?(?:education|academic\s+background|qualifications)\s*:?$/i,
    certifications: /^(?:[•\-\*]?\s*)?(?:certifications?|licenses|courses|achievements?|achievements\s*&\s*honors)\s*:?$/i
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

  // 3. Multi-Item Education Extractor (groups degrees, scores, institutions, and timelines)
  const educationList = [];
  if (sectionTextBlocks.education && sectionTextBlocks.education.length > 0) {
    const eduLines = sectionTextBlocks.education;
    let currentEdu = null;

    for (const line of eduLines) {
      const isBullet = line.startsWith('•') || line.startsWith('*');
      const hasInstitution = /\b(?:university|college|institute|vidyalaya|school|academy)\b/i.test(line);
      const hasDegree = /\b(?:bachelor|master|b\.tech|m\.tech|b\.e|b\.s|m\.s|class\s+[x|v|i]+|high\s+school|secondary|diploma)\b/i.test(line);
      const yearMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|-|to)?\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)?\b/i);
      const scoreMatch = line.match(/\b(?:CGPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|Percentage\s*[:\-]?\s*\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s*%|\b\d+\.\d+\s*\/\s*10(?:\.0)?\b)/i);

      const startsNewEdu = isBullet || (currentEdu && currentEdu.institution && hasInstitution && !currentEdu.degree);

      if (startsNewEdu || currentEdu === null) {
        if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
          educationList.push(currentEdu);
        }
        currentEdu = {
          degree: '',
          institution: '',
          graduation_year: yearMatch ? yearMatch[0] : '',
          score: scoreMatch ? scoreMatch[0] : ''
        };
      }

      if (yearMatch && !currentEdu.graduation_year) {
        currentEdu.graduation_year = yearMatch[0];
      }
      if (scoreMatch && !currentEdu.score) {
        currentEdu.score = scoreMatch[0];
      }

      let cleanLine = line
        .replace(/^[•\-\*]\s*/, '')
        .replace(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|-|to)?\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)?\b/gi, '')
        .replace(/\b(?:CGPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|Percentage\s*[:\-]?\s*\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s*%|\b\d+\.\d+\s*\/\s*10(?:\.0)?\b)/gi, '')
        .replace(/[()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (hasInstitution && (!currentEdu.institution || currentEdu.institution.length < cleanLine.length)) {
        currentEdu.institution = cleanLine;
      } else if (hasDegree || !currentEdu.degree) {
        currentEdu.degree = cleanLine;
      }
    }

    if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
      educationList.push(currentEdu);
    }
  }

  // 4. Multi-Item Experience Extractor (groups company, role, dates, and all responsibility bullets)
  const experienceList = [];
  if (sectionTextBlocks.experience && sectionTextBlocks.experience.length > 0) {
    const expLines = sectionTextBlocks.experience;
    let currentExp = null;

    const actionVerbRegex = /^[•\-\*–]?\s*(?:developed|implemented|built|optimized|engineered|designed|led|created|managed|collaborated|maintained|integrated|spearheaded|utilized|resolved)\b/i;
    const roleKeywordRegex = /\b(?:intern|developer|engineer|analyst|associate|lead|manager|architect|designer|specialist|consultant)\b/i;

    for (const line of expLines) {
      const dateMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|-|to)?\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)?\b/i);
      const isAction = actionVerbRegex.test(line);
      const hasBulletChar = /^[•\-\*–]\s+/.test(line);

      const isJobHeader = (!isAction && dateMatch) || (currentExp === null && !isAction);

      if (isJobHeader) {
        if (currentExp) {
          experienceList.push({
            ...currentExp,
            description: currentExp.bullets.join('\n')
          });
        }

        let cleanCompany = line
          .replace(/^[•\-\*–]\s*/, '')
          .replace(dateMatch ? dateMatch[0] : '', '')
          .replace(/[|\-–]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        currentExp = {
          company: cleanCompany || 'Company / Organization',
          role: '',
          duration: dateMatch ? dateMatch[0] : '',
          bullets: []
        };
      } else if (currentExp) {
        if (!currentExp.role && roleKeywordRegex.test(line) && !isAction && line.length < 80) {
          currentExp.role = line.replace(/^[•\-\*–]\s*/, '').trim();
        } else {
          const cleanBullet = line.replace(/^[•\-\*–]\s*/, '').trim();
          if (cleanBullet) {
            const prevBullet = currentExp.bullets[currentExp.bullets.length - 1];
            const isContinuation = prevBullet && (!hasBulletChar && (!/[.!?]$/.test(prevBullet) || /^[a-z]/.test(cleanBullet)));

            if (isContinuation) {
              currentExp.bullets[currentExp.bullets.length - 1] += ' ' + cleanBullet;
            } else {
              currentExp.bullets.push(cleanBullet);
            }
          }
        }
      }
    }

    if (currentExp) {
      experienceList.push({
        ...currentExp,
        description: currentExp.bullets.join('\n')
      });
    }
  }

  // 5. Multi-Item Projects Extractor (groups project title, technologies, dates, and achievements)
  const projectsList = [];
  if (sectionTextBlocks.projects && sectionTextBlocks.projects.length > 0) {
    const projLines = sectionTextBlocks.projects;
    let currentProj = null;

    const actionVerbRegex = /^[•\-\*–]?\s*(?:developed|implemented|built|optimized|engineered|designed|led|created|managed|integrated)\b/i;

    for (const line of projLines) {
      const hasBulletChar = /^[•\-\*–]\s+/.test(line);
      const isAction = actionVerbRegex.test(line);
      const dateMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\b/i);
      const hasProjectDelimiter = /[—–|]/.test(line) || /\(github|\(demo|\[link\]/i.test(line);

      const isProjHeader = (!isAction && (hasProjectDelimiter || dateMatch)) ||
                           (line.startsWith('•') && !isAction && (hasProjectDelimiter || dateMatch || line.length < 50));

      if (isProjHeader) {
        if (currentProj) {
          projectsList.push({
            ...currentProj,
            description: currentProj.bullets.join('\n')
          });
        }

        let rawHeader = line.replace(/^[•\-\*–]\s*/, '').trim();
        let projDate = dateMatch ? dateMatch[0] : '';
        rawHeader = rawHeader.replace(projDate, '').replace(/\[link\]/gi, '').trim();

        let pName = rawHeader;
        let pTechs = [];
        if (/[—–|]/.test(rawHeader)) {
          const parts = rawHeader.split(/[—–|]/);
          pName = parts[0].trim();
          const techPart = parts.slice(1).join(' ').replace(/\([^)]*\)/g, '').trim();
          pTechs = techPart.split(/[,/]/).map((t) => t.trim()).filter(Boolean);
        } else {
          pName = rawHeader.replace(/\([^)]*\)/g, '').trim();
        }

        currentProj = {
          name: pName,
          duration: projDate,
          bullets: [],
          technologies: pTechs
        };
      } else if (currentProj) {
        const cleanBullet = line.replace(/^[•\-\*–]\s*/, '').trim();
        if (cleanBullet) {
          const prevBullet = currentProj.bullets[currentProj.bullets.length - 1];
          const isContinuation = prevBullet && (!hasBulletChar && (!/[.!?]$/.test(prevBullet) || /^[a-z]/.test(cleanBullet)));

          if (isContinuation) {
            currentProj.bullets[currentProj.bullets.length - 1] += ' ' + cleanBullet;
          } else {
            currentProj.bullets.push(cleanBullet);
          }

          // Detect additional technologies in bullets using canonical dictionary
          for (const skill of CANONICAL_SKILLS_DICTIONARY) {
            const rx = new RegExp(`\\b${skill.canonical_name.replace(/[.+]/g, '\\$&')}\\b`, 'i');
            if (rx.test(line) && !currentProj.technologies.some((t) => t.toLowerCase() === skill.canonical_name.toLowerCase())) {
              currentProj.technologies.push(skill.canonical_name);
            }
          }
        }
      }
    }

    if (currentProj) {
      projectsList.push({
        ...currentProj,
        description: currentProj.bullets.join('\n')
      });
    }
  }

  // 6. Direct Skills Section Parsing & Canonical Matching
  const detectedSkillsMap = new Map();
  const normalizedText = rawText.toLowerCase();

  // (A) Check direct Skills Section category lines (e.g. "Languages: C, C++, JavaScript...")
  if (sectionTextBlocks.skills && sectionTextBlocks.skills.length > 0) {
    for (const line of sectionTextBlocks.skills) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const items = line.slice(colonIndex + 1).split(/[,|/]/).map((s) => s.trim()).filter(Boolean);
        for (const rawItem of items) {
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
    linkedin: linkedinUrl,
    github: githubUrl
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
