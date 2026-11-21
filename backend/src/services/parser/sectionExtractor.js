// Canonical skills lookup keywords for extraction
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'PHP',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Tailwind CSS', 'HTML5', 'CSS3', 'Redux',
  'Node.js', 'Express.js', 'Spring Boot', 'FastAPI', 'Django', 'Flask', 'REST API',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL',
  'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
  'DSA', 'Object-Oriented Programming', 'System Design'
];

export function extractSectionsAndProfile(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Heuristic Contact Extraction
  const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  const githubMatch = rawText.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);

  // First non-empty line is often the candidate name
  const candidateName = lines.length > 0 ? lines[0].slice(0, 80) : '';

  // Section splitting using common resume headings
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

  // Detect skills mentioned in skills section or entire text
  const detectedSkills = [];
  const normalizedText = rawText.toLowerCase();

  for (const skill of COMMON_SKILLS) {
    const regex = new RegExp(`\\b${skill.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalizedText)) {
      // Find a sentence or line containing this skill as evidence
      const evidenceLine = lines.find((l) => regex.test(l)) || `Demonstrated knowledge of ${skill}`;
      detectedSkills.push({
        skill_name: skill,
        section: sectionTextBlocks.skills.some((l) => regex.test(l)) ? 'skills' : 'projects',
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
    extraction_confidence: detectedSkills.length > 5 ? 0.92 : 0.75
  };
}
