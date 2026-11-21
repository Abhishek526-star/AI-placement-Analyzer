// Default canonical skills & alias dictionary (seeded from migration 007)
export const CANONICAL_SKILLS_DICTIONARY = [
  {
    canonical_name: 'JavaScript',
    category: 'Programming Language',
    aliases: ['js', 'javascript', 'ecmascript', 'es6', 'es6+', 'vanilla js']
  },
  {
    canonical_name: 'TypeScript',
    category: 'Programming Language',
    aliases: ['ts', 'typescript']
  },
  {
    canonical_name: 'Python',
    category: 'Programming Language',
    aliases: ['python 3', 'python3', 'py']
  },
  {
    canonical_name: 'Java',
    category: 'Programming Language',
    aliases: ['core java', 'java 8', 'java 11', 'java 17', 'java 21', 'jdk']
  },
  {
    canonical_name: 'C++',
    category: 'Programming Language',
    aliases: ['cpp', 'c plus plus']
  },
  {
    canonical_name: 'React',
    category: 'Frontend',
    aliases: ['reactjs', 'react.js', 'react 18', 'react 19']
  },
  {
    canonical_name: 'Next.js',
    category: 'Frontend',
    aliases: ['nextjs', 'next.js', 'next']
  },
  {
    canonical_name: 'Tailwind CSS',
    category: 'Frontend',
    aliases: ['tailwind', 'tailwindcss']
  },
  {
    canonical_name: 'Node.js',
    category: 'Backend',
    aliases: ['node', 'nodejs', 'node js']
  },
  {
    canonical_name: 'Express.js',
    category: 'Backend',
    aliases: ['express', 'expressjs', 'express.js']
  },
  {
    canonical_name: 'Spring Boot',
    category: 'Backend',
    aliases: ['springboot', 'spring boot', 'spring framework']
  },
  {
    canonical_name: 'FastAPI',
    category: 'Backend',
    aliases: ['fast api', 'fastapi']
  },
  {
    canonical_name: 'REST API Development',
    category: 'Backend',
    aliases: ['rest', 'restful api', 'restful apis', 'rest apis', 'rest api', 'api design']
  },
  {
    canonical_name: 'SQL',
    category: 'Database',
    aliases: ['structured query language', 'rdbms', 'relational database']
  },
  {
    canonical_name: 'PostgreSQL',
    category: 'Database',
    aliases: ['postgres', 'pg', 'psql', 'postgresql']
  },
  {
    canonical_name: 'MongoDB',
    category: 'Database',
    aliases: ['mongo', 'mongo db', 'mongodb']
  },
  {
    canonical_name: 'Redis',
    category: 'Database',
    aliases: ['redis', 'redis cache']
  },
  {
    canonical_name: 'Git',
    category: 'DevOps & Tools',
    aliases: ['git', 'github', 'gitlab', 'version control']
  },
  {
    canonical_name: 'Docker',
    category: 'DevOps & Tools',
    aliases: ['docker', 'containerization', 'docker compose']
  },
  {
    canonical_name: 'AWS',
    category: 'Cloud',
    aliases: ['amazon web services', 'aws s3', 'aws ec2', 'aws lambda', 'aws']
  }
];

export function normalizeSkill(inputSkill) {
  if (!inputSkill || typeof inputSkill !== 'string') {
    return null;
  }

  const raw = inputSkill.trim();
  const lower = raw.toLowerCase();

  // Strict Boundary Protection: never confuse Java and JavaScript
  if (lower === 'java' || lower === 'core java') {
    return {
      canonical_name: 'Java',
      category: 'Programming Language',
      original: raw
    };
  }

  if (lower === 'javascript' || lower === 'js') {
    return {
      canonical_name: 'JavaScript',
      category: 'Programming Language',
      original: raw
    };
  }

  // Exact match check on canonical names
  for (const item of CANONICAL_SKILLS_DICTIONARY) {
    if (item.canonical_name.toLowerCase() === lower) {
      return {
        canonical_name: item.canonical_name,
        category: item.category,
        original: raw
      };
    }
  }

  // Alias match check
  for (const item of CANONICAL_SKILLS_DICTIONARY) {
    if (item.aliases.includes(lower)) {
      return {
        canonical_name: item.canonical_name,
        category: item.category,
        original: raw
      };
    }
  }

  // Fallback: Preserve original casing with clean formatting
  return {
    canonical_name: raw,
    category: 'Other',
    original: raw
  };
}
