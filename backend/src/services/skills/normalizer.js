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
    aliases: ['cpp', 'c plus plus', 'c/c++']
  },
  {
    canonical_name: 'C',
    category: 'Programming Language',
    aliases: ['c language', 'ansi c']
  },
  {
    canonical_name: 'HTML',
    category: 'Frontend',
    aliases: ['html5', 'html 5']
  },
  {
    canonical_name: 'CSS',
    category: 'Frontend',
    aliases: ['css3', 'css 3']
  },
  {
    canonical_name: 'Three.js',
    category: 'Frontend',
    aliases: ['threejs', 'three.js', '3d web', 'webgl']
  },
  {
    canonical_name: 'Recharts',
    category: 'Frontend',
    aliases: ['recharts', 'chart.js', 'data visualization']
  },
  {
    canonical_name: 'Axios',
    category: 'Frontend',
    aliases: ['axios', 'http client']
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
    canonical_name: 'MySQL',
    category: 'Database',
    aliases: ['mysql database', 'my sql']
  },
  {
    canonical_name: 'Postman',
    category: 'DevOps & Tools',
    aliases: ['postman api', 'postman tool']
  },
  {
    canonical_name: 'VS Code',
    category: 'DevOps & Tools',
    aliases: ['vscode', 'visual studio code']
  },
  {
    canonical_name: 'RAG',
    category: 'AI & Machine Learning',
    aliases: ['retrieval-augmented generation', 'retrieval augmented generation', 'rag systems']
  },
  {
    canonical_name: 'Vector Embeddings',
    category: 'AI & Machine Learning',
    aliases: ['embeddings', 'vector search', 'vector database']
  },
  {
    canonical_name: 'ChromaDB',
    category: 'AI & Machine Learning',
    aliases: ['chroma', 'chromadb']
  },
  {
    canonical_name: 'LangChain',
    category: 'AI & Machine Learning',
    aliases: ['langchain framework', 'lang chain']
  },
  {
    canonical_name: 'Semantic Search',
    category: 'AI & Machine Learning',
    aliases: ['semantic retrieval']
  },
  {
    canonical_name: 'LLM Integration',
    category: 'AI & Machine Learning',
    aliases: ['llm', 'large language models', 'genai', 'generative ai']
  },
  {
    canonical_name: 'JWT',
    category: 'Security',
    aliases: ['json web token', 'jwt authentication', 'jwt auth']
  },
  {
    canonical_name: 'Razorpay',
    category: 'Fintech & Payment',
    aliases: ['razorpay gateway', 'payment gateway']
  },
  {
    canonical_name: 'Render',
    category: 'Cloud & Hosting',
    aliases: ['render cloud', 'render.com', 'render deployment']
  },
  {
    canonical_name: 'Data Structures and Algorithms',
    category: 'Core Computer Science',
    aliases: ['dsa', 'data structures & algorithms', 'data structures', 'algorithms']
  },
  {
    canonical_name: 'Object-Oriented Programming',
    category: 'Core Computer Science',
    aliases: ['oop', 'oops', 'object oriented design']
  },
  {
    canonical_name: 'Database Management System',
    category: 'Core Computer Science',
    aliases: ['dbms', 'database management']
  },
  {
    canonical_name: 'Computer Networks',
    category: 'Core Computer Science',
    aliases: ['computer network', 'networking', 'cn']
  },
  {
    canonical_name: 'Operating Systems',
    category: 'Core Computer Science',
    aliases: ['operating system', 'os']
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
