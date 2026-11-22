import { CANONICAL_SKILLS_DICTIONARY } from '../skills/normalizer.js';
import { getAIProvider } from '../ai/aiProvider.js';

/**
 * Deterministic Section and Profile Extractor.
 * Parses raw text from resumes of various layouts and templates.
 * Enforces strict rule: if a field or section is not present in the document,
 * leave it empty ("" or []) rather than creating dummy/placeholder values.
 */
export function extractSectionsAndProfile(rawText, options = {}) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Contact Extraction
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  
  // International & Indian Phone Number regex (handles +91-6387104522, +1-617-555-0144, (555) 123-4567, 123-456-7890, etc.)
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}|\+?\d{1,3}[-.\s]?\d{10}/);

  // Candidate Name extraction: clean out phone, email, symbols, and labels from top lines
  let candidateName = '';
  if (lines.length > 0) {
    let rawNameLine = lines[0];
    const segments = rawNameLine.split(/[#|•—–]|\s--\s/);
    let namePart = segments[0].trim();
    namePart = namePart.replace(/(?:phone|mob|mobile|tel|contact|email|roll\s*no)[\s:\-].*$/i, '').trim();
    namePart = namePart.replace(/[^a-zA-Z\s.'-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const words = namePart.split(' ').filter(Boolean);
    if (
      words.length >= 1 &&
      words.length <= 5 &&
      namePart.length >= 2 &&
      !/^(?:resume|curriculum|vitae|page|profile|summary|education|experience)$/i.test(namePart)
    ) {
      candidateName = namePart;
    } else {
      candidateName = '';
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

  // 2. Comprehensive Section Heading Matchers (handles multiple formats: Jake's, Harvard, Deedy, Classic, Modern)
  const sectionHeaders = {
    summary: /^(?:[•\-\*]?\s*)?(?:summary|professional\s+summary|executive\s+summary|career\s+summary|objective|career\s+objective|about\s+me|profile)\s*:?$/i,
    skills: /^(?:[•\-\*]?\s*)?(?:skills|technical\s+skills|skills\s*&\s*technologies|tech\s+stack|technologies|core\s+competencies|tools\s*&\s*technologies|tools|proficiencies|areas\s+of\s+expertise|technical\s+proficiencies)\s*:?$/i,
    experience: /^(?:[•\-\*]?\s*)?(?:experience|work\s+experience|professional\s+experience|employment\s+history|work\s+history|career\s+history|relevant\s+experience|internships?|internship\s+experience|professional\s+background|industry\s+experience)\s*:?$/i,
    projects: /^(?:[•\-\*]?\s*)?(?:projects|personal\s+projects|academic\s+projects|key\s+projects|technical\s+projects|selected\s+projects|featured\s+projects|software\s+projects|engineering\s+projects|open\s+source|portfolio)\s*:?$/i,
    education: /^(?:[•\-\*]?\s*)?(?:education|academic\s+background|academic\s+history|academics|qualifications|educational\s+qualifications|education\s*&\s*training|degrees|scholastic\s+achievements)\s*:?$/i,
    certifications: /^(?:[•\-\*]?\s*)?(?:certifications?|certificates|licenses|courses|coursework|relevant\s+coursework|achievements?|honors?|awards?|achievements\s*&\s*honors)\s*:?$/i
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
      const hasDegree = /\b(?:bachelor|master|b\.tech|m\.tech|b\.e|b\.s|m\.s|class\s+[x|v|i]+|high\s+school|secondary|diploma|b\.a|m\.a|ph\.d)\b/i.test(line);
      const yearMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|—|--|-|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)\b/i) ||
                        line.match(/\b(19\d{2}|20\d{2})\b/);
      const scoreMatch = line.match(/\b(?:CGPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|GPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|Percentage\s*[:\-]?\s*\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s*%|\b\d+\.\d+\s*\/\s*10(?:\.0)?\b|\b\d+\.\d+\s*\/\s*4(?:\.0)?\b)/i);

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
        .replace(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|—|--|-|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)\b/gi, '')
        .replace(/\b(?:CGPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|GPA\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|Percentage\s*[:\-]?\s*\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s*%|\b\d+\.\d+\s*\/\s*10(?:\.0)?\b|\b\d+\.\d+\s*\/\s*4(?:\.0)?\b)/gi, '')
        .replace(/[()]/g, ' ')
        .replace(/--/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (hasDegree) {
        if (currentEdu.degree && !hasDegree.test?.(currentEdu.degree) && !currentEdu.institution) {
          currentEdu.institution = currentEdu.degree;
        }
        currentEdu.degree = cleanLine;
      } else if (hasInstitution || !currentEdu.institution) {
        currentEdu.institution = cleanLine;
      } else {
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
      const dateMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2})\s*(?:–|—|--|-|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19\d{2}|20\d{2}|present|current)?\b/i) ||
                        line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)(19\d{2}|20\d{2})\b/i);
      const isAction = actionVerbRegex.test(line);
      const hasBulletChar = /^[•\-\*–]\s+/.test(line);

      const isNewJob =
        (currentExp === null && !isAction) ||
        (!isAction && dateMatch && currentExp && (currentExp.bullets.length > 0 || (currentExp.role && currentExp.duration)));

      if (isNewJob) {
        if (currentExp && (currentExp.company || currentExp.role || currentExp.bullets.length > 0)) {
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
          company: cleanCompany,
          role: '',
          duration: dateMatch ? dateMatch[0] : '',
          bullets: []
        };
      } else if (currentExp) {
        if (dateMatch && !currentExp.duration) {
          currentExp.duration = dateMatch[0];
        }

        if (!currentExp.role && roleKeywordRegex.test(line) && !isAction && line.length < 90) {
          let cleanRole = line
            .replace(/^[•\-\*–]\s*/, '')
            .replace(dateMatch ? dateMatch[0] : '', '')
            .replace(/[()]/g, '')
            .trim();
          currentExp.role = cleanRole;
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

    if (currentExp && (currentExp.company || currentExp.role || currentExp.bullets.length > 0)) {
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
      const hasProjectDelimiter = /[—–|]|\s--\s/.test(line) || /\(github|\(demo|\(live|\[link\]/i.test(line);

      const isProjHeader = (!isAction && (hasProjectDelimiter || dateMatch)) ||
                           (line.startsWith('•') && !isAction && (hasProjectDelimiter || dateMatch || line.length < 50));

      if (isProjHeader) {
        if (currentProj && (currentProj.name || currentProj.bullets.length > 0)) {
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
        if (/[—–|]|\s--\s/.test(rawHeader)) {
          const parts = rawHeader.split(/[—–|]|\s--\s/);
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

    if (currentProj && (currentProj.name || currentProj.bullets.length > 0)) {
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

/**
 * Merges and rechecks deterministic parser output with AI structured extraction.
 * Strictly guarantees that missing fields/sections remain empty ("" or []).
 */
export function mergeAndRecheckProfiles(det, ai, options = {}) {
  // 1. Contact Info Recheck
  const contact = {
    full_name: (ai.contact?.full_name || det.parsed_data?.contact?.full_name || '').trim(),
    email: (ai.contact?.email || det.parsed_data?.contact?.email || '').trim(),
    phone: (ai.contact?.phone || det.parsed_data?.contact?.phone || '').trim(),
    linkedin: (det.parsed_data?.contact?.linkedin || ai.contact?.linkedin || '').trim(),
    github: (det.parsed_data?.contact?.github || ai.contact?.github || '').trim()
  };

  // 2. Education Recheck
  let education = [];
  const rawEdu = (Array.isArray(ai.education) && ai.education.length > 0)
    ? ai.education
    : (det.parsed_data?.education || []);

  for (const e of rawEdu) {
    const inst = (e.institution || '').replace(/^(?:institution|university|school|n\/a)$/i, '').trim();
    const deg = (e.degree || '').replace(/^(?:degree|n\/a)$/i, '').trim();
    const score = (e.score || '').replace(/^(?:score|n\/a)$/i, '').trim();
    const year = (e.graduation_year || '').replace(/^(?:year|n\/a)$/i, '').trim();

    if (inst || deg) {
      education.push({
        institution: inst,
        degree: deg,
        score: score,
        graduation_year: year
      });
    }
  }

  // 3. Experience Recheck
  let experience = [];
  const rawExp = (Array.isArray(ai.experience) && ai.experience.length > 0)
    ? ai.experience
    : (det.parsed_data?.experience || []);

  for (const exp of rawExp) {
    const comp = (exp.company || '').replace(/^(?:company\s*\/?\s*organization|company|n\/a)$/i, '').trim();
    const role = (exp.role || '').replace(/^(?:role|title|n\/a)$/i, '').trim();
    const dur = (exp.duration || '').trim();
    const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b) => b && b.trim()) : [];
    const desc = exp.description || bullets.join('\n');

    if (comp || role || bullets.length > 0) {
      experience.push({
        company: comp,
        role: role,
        duration: dur,
        bullets: bullets,
        description: desc
      });
    }
  }

  // 4. Projects Recheck
  let projects = [];
  const rawProj = (Array.isArray(ai.projects) && ai.projects.length > 0)
    ? ai.projects
    : (det.parsed_data?.projects || []);

  for (const p of rawProj) {
    const name = (p.name || '').replace(/^(?:featured\s*project|project|n\/a)$/i, '').trim();
    const techs = Array.isArray(p.technologies) ? p.technologies.filter((t) => t && t.trim()) : [];
    const dur = (p.duration || '').trim();
    const bullets = Array.isArray(p.bullets) ? p.bullets.filter((b) => b && b.trim()) : [];
    const desc = p.description || bullets.join('\n');

    if (name || bullets.length > 0) {
      projects.push({
        name: name,
        technologies: techs,
        duration: dur,
        bullets: bullets,
        description: desc
      });
    }
  }

  // 5. Skills Recheck & Canonical Enrichment
  const skillsMap = new Map();
  for (const s of (det.skills || [])) {
    skillsMap.set(s.skill_name.toLowerCase(), s);
  }

  if (Array.isArray(ai.skills)) {
    for (const rawSkill of ai.skills) {
      if (typeof rawSkill === 'string' && rawSkill.trim()) {
        const canonical = CANONICAL_SKILLS_DICTIONARY.find(
          (c) =>
            c.canonical_name.toLowerCase() === rawSkill.toLowerCase() ||
            c.aliases.includes(rawSkill.toLowerCase())
        );
        const name = canonical ? canonical.canonical_name : rawSkill.trim();
        if (!skillsMap.has(name.toLowerCase())) {
          skillsMap.set(name.toLowerCase(), {
            skill_name: name,
            section: 'skills',
            evidence_text: `Identified by AI profile analyzer from resume`,
            confidence: 0.95
          });
        }
      }
    }
  }

  return {
    parsed_data: {
      contact,
      education,
      experience,
      projects,
      certifications: det.parsed_data?.certifications || []
    },
    skills: Array.from(skillsMap.values()),
    extraction_confidence: 0.95
  };
}

/**
 * Intelligent Two-Tier Profile Extractor.
 * Runs fast deterministic extraction first, then enriches and verifies with Gemini AI.
 * If AI is unavailable or offline, gracefully falls back to deterministic extraction.
 */
export async function extractAndVerifyProfile(rawText, options = {}) {
  // Tier 1: Fast deterministic baseline extraction
  const deterministicResult = extractSectionsAndProfile(rawText, options);

  // Tier 2: Check for AI Provider availability
  const aiProvider = options.aiProvider || getAIProvider();

  // If mock provider or no real Gemini key configured in environment, return deterministic baseline
  if (
    !aiProvider ||
    aiProvider.constructor.name === 'MockAIProvider' ||
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY === 'dummy_gemini_api_key_for_dev'
  ) {
    return deterministicResult;
  }

  // AI Extraction & Recheck Pass
  try {
    const systemPrompt = `You are an expert resume parsing engine for an ATS system.
Extract the candidate profile from the resume text into the exact JSON format below.
CRITICAL GROUNDING RULES:
1. If any field or section (experience, projects, education, contact, skills) is NOT present in the resume text, leave it EMPTY (e.g. empty string "" or empty array []).
2. NEVER invent, fabricate, or assume any information, placeholders, or dummy text (like "Company / Organization", "Featured Project", "2026", "N/A", etc.).
3. Group bullet points and descriptions under the respective project or work experience item.
4. Extract only real projects, experience, education, contact, and skills.

JSON Structure:
{
  "contact": {
    "full_name": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "github": ""
  },
  "education": [
    {
      "institution": "",
      "degree": "",
      "score": "",
      "graduation_year": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "bullets": [],
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "technologies": [],
      "duration": "",
      "bullets": [],
      "description": ""
    }
  ],
  "skills": []
}`;

    const aiResult = await aiProvider.generateStructuredJSON({
      systemPrompt,
      userPrompt: `Here is the verbatim resume text:\n"""\n${rawText.slice(0, 8000)}\n"""`,
      temperature: 0.1
    });

    if (aiResult && typeof aiResult === 'object') {
      return mergeAndRecheckProfiles(deterministicResult, aiResult, options);
    }
  } catch (err) {
    console.warn('[AIProfileExtractionWarning] Falling back to deterministic profile parser:', err.message);
  }

  return deterministicResult;
}
