/**
 * Evidence-First Resume Suggestions Engine (PRD FR-12, ADR-04)
 * 
 * Provides honest, non-templated, grounded resume improvement advice tailored to:
 * 1. The candidate's actual projects and work experience bullets
 * 2. Specific technical domains (Frontend, Backend, Database, Cloud, DevOps, Core CS)
 * 3. Strict truthfulness: Missing skills are classified as 'acquire_new_skill' with target_quote: null,
 *    never advising candidates to fabricate experience.
 */

// 1. Comprehensive Domain-Specific Advice Catalog for Known Skills
const DOMAIN_SKILL_CATALOG = {
  // Frontend & UI
  'tailwind css': {
    improve_wording: 'Highlight responsive utility breakpoints (sm, md, lg), custom design tokens in tailwind.config.js, and zero-runtime CSS bundle efficiency in your UI layout.',
    highlight_existing: 'Specify where you applied utility-first styling vs. custom CSS modules in your project components.',
    acquire_new: 'Build a responsive multi-page dashboard utilizing Tailwind CSS utility classes and custom color tokens.'
  },
  'react': {
    improve_wording: 'Specify component architecture patterns (e.g., Redux Toolkit slices, custom hooks), component re-render optimizations (React.memo/useCallback), and virtualized lists.',
    highlight_existing: 'Explicitly describe how you structured React component state, props interfaces, and lifecycle hooks in your frontend modules.',
    acquire_new: 'Build a dynamic single-page web application showcasing React functional components, hooks, and clean state management.'
  },
  'react.js': {
    improve_wording: 'Specify component architecture patterns (e.g., Redux Toolkit slices, custom hooks), component re-render optimizations (React.memo/useCallback), and virtualized lists.',
    highlight_existing: 'Explicitly describe how you structured React component state, props interfaces, and lifecycle hooks in your frontend modules.',
    acquire_new: 'Build a dynamic single-page web application showcasing React functional components, hooks, and clean state management.'
  },
  'next.js': {
    improve_wording: 'Detail Server-Side Rendering (SSR), Static Site Generation (SSG), or API routes implemented for optimal SEO and fast first contentful paint.',
    highlight_existing: 'Explicitly showcase how your React and Node.js foundation translates to Next.js App Router, Server Components, and SSR routes.',
    acquire_new: 'Build a full-stack project utilizing Next.js App Router and server components to showcase modern SSR capabilities.'
  },
  'three.js': {
    improve_wording: 'Detail 3D scene rendering optimizations, polygon mesh reduction, and frame rate stabilization (e.g., maintaining 60 FPS) in your 3D layout simulation.',
    highlight_existing: 'Highlight your hands-on 3D scene construction, camera controls, and lighting configurations in your project bullets.',
    acquire_new: 'Create an interactive 3D portfolio viewer or product showcase using Three.js and WebGL.'
  },
  'redux': {
    improve_wording: 'Detail centralized state normalization (createSlice, createAsyncThunk), memoized selectors with Reselect, and predictable state dispatching.',
    highlight_existing: 'Mention the specific global state slices and asynchronous thunks you managed with Redux in your project.',
    acquire_new: 'Incorporate Redux Toolkit into your stateful applications to manage complex asynchronous user flows.'
  },
  'redux toolkit': {
    improve_wording: 'Detail centralized state normalization (createSlice, createAsyncThunk), memoized selectors with Reselect, and predictable state dispatching.',
    highlight_existing: 'Mention the specific global state slices and asynchronous thunks you managed with Redux in your project.',
    acquire_new: 'Incorporate Redux Toolkit into your stateful applications to manage complex asynchronous user flows.'
  },
  'html': {
    improve_wording: 'Highlight semantic HTML5 elements (<article>, <nav>, <section>), web accessibility standards (ARIA roles), and SEO metadata structure.',
    highlight_existing: 'Emphasize your clean semantic markup and screen-reader accessibility across your frontend interfaces.',
    acquire_new: 'Review W3C accessibility guidelines and implement accessible semantic markup across web templates.'
  },
  'css': {
    improve_wording: 'Detail CSS Flexbox/Grid layout systems, CSS custom properties (variables), media queries, and cross-browser consistency.',
    highlight_existing: 'Highlight your hands-on mastery of CSS layout models and responsive styling techniques.',
    acquire_new: 'Build responsive grid and flexbox layouts with smooth transitions and CSS animations.'
  },
  'javascript': {
    improve_wording: 'Emphasize modern ES6+ idioms (destructuring, async/await, optional chaining), event loop comprehension, and modular code organization.',
    highlight_existing: 'Elaborate on complex client-side logic, asynchronous event handling, and DOM manipulation powered by JavaScript.',
    acquire_new: 'Deepen core JavaScript fundamentals including closures, prototypes, event bubbling, and async promises.'
  },
  'typescript': {
    improve_wording: 'Highlight strict type safety, generic interfaces, union types, and compile-time error reduction across application layers.',
    highlight_existing: 'Highlight any typed components, TypeScript migration branches, or strict typing configurations applied to your projects.',
    acquire_new: 'Refactor key modules or utility functions with TypeScript interfaces and strict type checking to demonstrate type-safe development practices.'
  },

  // Backend & APIs
  'node.js': {
    improve_wording: 'Detail asynchronous event-loop handling, server-side stream processing, or benchmarked API throughput (req/sec) under concurrent user traffic.',
    highlight_existing: 'Explicitly describe your backend runtime architecture and asynchronous I/O operations powered by Node.js.',
    acquire_new: 'Build a production-grade RESTful microservice with Node.js featuring structured logging, environment configs, and graceful shutdown.'
  },
  'express.js': {
    improve_wording: 'Highlight custom middleware architecture (e.g. rate-limiting, centralized error handling, and role-based auth guards) rather than basic route definitions.',
    highlight_existing: 'Detail how you structured route controllers, validation middleware, and HTTP response pipelines using Express.',
    acquire_new: 'Develop a modular Express.js backend with layered controller/service architecture and comprehensive error handling.'
  },
  'express': {
    improve_wording: 'Highlight custom middleware architecture (e.g. rate-limiting, centralized error handling, and role-based auth guards) rather than basic route definitions.',
    highlight_existing: 'Detail how you structured route controllers, validation middleware, and HTTP response pipelines using Express.',
    acquire_new: 'Develop a modular Express.js backend with layered controller/service architecture and comprehensive error handling.'
  },
  'rest api development': {
    improve_wording: 'Specify HTTP status code semantics, request payload schema validation, structured pagination, and sub-100ms response benchmarks.',
    highlight_existing: 'Detail specific CRUD endpoints, request/response contracts, and filtering parameters designed for your REST APIs.',
    acquire_new: 'Design and document a REST API following OpenAPI/Swagger specifications with rigorous status code handling.'
  },
  'rest apis': {
    improve_wording: 'Specify HTTP status code semantics, request payload schema validation, structured pagination, and sub-100ms response benchmarks.',
    highlight_existing: 'Detail specific CRUD endpoints, request/response contracts, and filtering parameters designed for your REST APIs.',
    acquire_new: 'Design and document a REST API following OpenAPI/Swagger specifications with rigorous status code handling.'
  },
  'socket.io': {
    improve_wording: 'Highlight real-time event emission, bi-directional client-server synchronization, and reconnection resilience under intermittent connectivity.',
    highlight_existing: 'Specify the real-time features (e.g., live chat, collaborative editing, or instant status updates) driven by Socket.IO.',
    acquire_new: 'Implement a real-time event-driven communication channel using Socket.IO with rooms and fallback polling.'
  },
  'websockets': {
    improve_wording: 'Detail full-duplex socket lifecycle handling, binary frame streaming, heartbeat ping-pong intervals, and low-latency payload serialization.',
    highlight_existing: 'Highlight real-time full-duplex bidirectional streaming implemented in your network architecture.',
    acquire_new: 'Build a real-time WebSocket protocol client and server for streaming live metric updates.'
  },

  // Databases & Storage
  'mongodb': {
    improve_wording: 'Describe schema design choices, compound indexing for filtered queries, and aggregation pipeline stages for summary calculations.',
    highlight_existing: 'Mention specific collections, document schemas, and indexing strategies implemented in MongoDB.',
    acquire_new: 'Model complex relational-like documents in MongoDB with schema validation and multi-stage aggregation pipelines.'
  },
  'mongoose': {
    improve_wording: 'Detail schema validation rules, custom pre/post middleware hooks, and populate optimization to prevent N+1 query bottlenecks.',
    highlight_existing: 'Specify your data modeling, schema type casting, and query helpers defined with Mongoose.',
    acquire_new: 'Implement structured ODM schemas with Mongoose including lifecycle hooks and index definitions.'
  },
  'postgresql': {
    improve_wording: 'Highlight relational schema normalization (3NF), query indexing (B-Tree/GIN), multi-table JOIN optimization, and ACID transaction safety.',
    highlight_existing: 'Detail specific relational tables, foreign key constraints, and SQL queries executed against PostgreSQL.',
    acquire_new: 'Design a normalized PostgreSQL database schema with indexing and write complex multi-table SQL queries.'
  },
  'sql': {
    improve_wording: 'Quantify query execution improvements (EXPLAIN ANALYZE), index tuning, and complex analytical window functions or CTEs utilized.',
    highlight_existing: 'Highlight your proficiency with relational query authoring, table joins, and transactional consistency in SQL.',
    acquire_new: 'Practice writing analytical SQL queries involving Common Table Expressions (CTEs), window functions, and indexing.'
  },
  'redis': {
    improve_wording: 'Explain caching strategies (cache-aside, TTL expiration) or distributed session storage used to reduce database read load.',
    highlight_existing: 'Specify where Redis was integrated as an in-memory cache, message broker, or rate-limiting store.',
    acquire_new: 'Set up Redis caching with TTL eviction policies to accelerate repetitive database read queries.'
  },

  // Security & Authentication
  'jwt': {
    improve_wording: 'Detail token lifecycle management (short-lived access tokens, refresh token rotation), HTTP-only cookie security, and role-based payload decoding.',
    highlight_existing: 'Explicitly describe how JSON Web Tokens are issued, signed, and validated across protected API routes.',
    acquire_new: 'Implement stateless JWT authentication with refresh token rotation and secure cookie transmission.'
  },
  'bcrypt': {
    improve_wording: 'Specify cryptographic salt rounds configuration and defense mechanisms against brute-force and rainbow table attacks.',
    highlight_existing: 'Clarify how password hashing and secure credential verification are handled in user registration and login.',
    acquire_new: 'Implement secure user credential storage using bcrypt with proper salting and cost factor calibration.'
  },

  // Integrations & Cloud Services
  'razorpay': {
    improve_wording: 'Highlight secure server-side HMAC signature verification, webhook idempotent event handling, and checkout failure recovery workflows.',
    highlight_existing: 'Specify the end-to-end checkout flow and payment verification steps you integrated using Razorpay.',
    acquire_new: 'Integrate a sandbox payment gateway (e.g. Razorpay/Stripe) with cryptographic signature validation on payment webhooks.'
  },
  'cloudinary': {
    improve_wording: 'Describe media pipeline automation (dynamic image transformation, WebP conversion) and secure signed upload presets.',
    highlight_existing: 'Detail how user-uploaded media files are validated and stored via Cloudinary APIs.',
    acquire_new: 'Implement cloud media storage using Cloudinary with client upload widgets and server-side signing.'
  },

  // DevOps & Tools
  'docker': {
    improve_wording: 'Detail multi-stage Dockerfile builds to minimize image footprint, container isolation, and local orchestration with docker-compose.',
    highlight_existing: 'Explicitly document your containerization experiments or docker-compose configurations in your project repository README and resume bullets.',
    acquire_new: 'Consider containerizing your full-stack application with a multi-stage Dockerfile and docker-compose orchestration to demonstrate deployment readiness.'
  },
  'git': {
    improve_wording: 'Highlight version control workflows: feature branching, clean commit conventions, pull request reviews, and GitHub Actions CI pipelines.',
    highlight_existing: 'Mention your team collaboration practices involving Git branch workflows and repository maintenance.',
    acquire_new: 'Adopt structured Git workflows including conventional commits, feature branches, and pull request reviews.'
  },
  'github': {
    improve_wording: 'Highlight GitHub Actions CI/CD automation, automated testing upon push, and markdown repository documentation.',
    highlight_existing: 'Link active GitHub repositories showcasing clean commit history and comprehensive README documentation.',
    acquire_new: 'Build a GitHub Actions workflow to automatically run tests and lint checks on every pull request.'
  },

  // Core CS & Algorithms
  'data structures and algorithms': {
    improve_wording: 'Quantify competitive coding milestones (e.g., LeetCode/CodeChef ratings, 500+ problems solved) and cite algorithmic complexity optimizations (e.g. O(N log N) vs O(N²)) in your project features.',
    highlight_existing: 'Connect your problem-solving background to practical algorithmic choices made in data processing and search algorithms.',
    acquire_new: 'Practice core algorithmic paradigms (dynamic programming, graphs, trees) on LeetCode/GeeksforGeeks to strengthen technical problem solving.'
  },
  'object-oriented programming': {
    improve_wording: 'Demonstrate clean architectural patterns (SOLID principles, Factory, Strategy, and Repository patterns) applied across your backend service controllers.',
    highlight_existing: 'Highlight class hierarchies, interface contracts, and encapsulation boundaries designed in your application logic.',
    acquire_new: 'Refactor procedural backend code into clean OOP classes applying SOLID principles and design patterns.'
  },
  'operating systems': {
    improve_wording: 'Detail understanding of concurrency primitives, multi-threading synchronization, process IPC, and memory management in systems engineering.',
    highlight_existing: 'Highlight system-level knowledge applied to process management, file I/O, or thread safety.',
    acquire_new: 'Deepen core OS concepts including process scheduling, virtual memory, race conditions, and synchronization locks.'
  },
  'database management systems': {
    improve_wording: 'Highlight relational modeling, B-tree vs hash indexing, transaction isolation levels, and concurrency control.',
    highlight_existing: 'Explain database normalization, schema design, and query optimization decisions made in your projects.',
    acquire_new: 'Study relational transaction isolation levels (ACID), locking mechanisms, and database recovery protocols.'
  },
  'computer networks': {
    improve_wording: 'Highlight knowledge of TCP/IP handshakes, HTTP/HTTPS protocol headers, DNS resolution, and latency mitigation.',
    highlight_existing: 'Detail network protocol handling, REST over HTTP/HTTPS, and socket communication in distributed systems.',
    acquire_new: 'Review TCP/UDP transport characteristics, TLS handshake mechanisms, and HTTP/2 multiplexing.'
  }
};

/**
 * Normalizes skill names for fuzzy dictionary matching.
 */
function normalizeSkillKey(skillName) {
  return (skillName || '')
    .trim()
    .toLowerCase()
    .replace(/[._\-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Searches candidate's projects and work experience for an exact accomplishment bullet.
 * Never returns generic raw skills block lines (e.g., "- Frontend & Backend: HTML, CSS...").
 * 
 * @param {string} skillName 
 * @param {Array} projects 
 * @param {Array} experience 
 * @param {string} fallbackQuote 
 * @returns {string|null}
 */
export function findBestResumeQuote(skillName, projects = [], experience = [], fallbackQuote = '') {
  if (!skillName) return null;
  const rawKey = skillName.trim().toLowerCase();

  // 1. Build comprehensive search aliases for this skill
  const aliases = [rawKey];
  const normalizedKey = normalizeSkillKey(skillName);
  if (normalizedKey !== rawKey) aliases.push(normalizedKey);

  if (rawKey.includes('react')) aliases.push('react', 'react.js', 'reactjs');
  if (rawKey.includes('node')) aliases.push('node', 'node.js', 'nodejs');
  if (rawKey.includes('express')) aliases.push('express', 'express.js', 'expressjs');
  if (rawKey.includes('tailwind')) aliases.push('tailwind', 'tailwind css', 'tailwindcss');
  if (rawKey.includes('rest')) aliases.push('rest api', 'rest apis', 'restful', 'rest');
  if (rawKey.includes('dsa') || rawKey.includes('data structure') || rawKey.includes('algorithm')) {
    aliases.push('dsa', 'data structures', 'algorithms', 'leetcode', 'codechef', 'problems solved');
  }
  if (rawKey.includes('oop') || rawKey.includes('object-oriented')) {
    aliases.push('oop', 'oops', 'object-oriented', 'solid principles', 'design patterns');
  }
  if (rawKey.includes('socket') || rawKey.includes('websocket')) {
    aliases.push('socket.io', 'websocket', 'websockets');
  }
  if (rawKey.includes('three')) aliases.push('three.js', 'threejs', '3d');
  if (rawKey.includes('jwt')) aliases.push('jwt', 'json web token');
  if (rawKey.includes('bcrypt')) aliases.push('bcrypt', 'password hashing');
  if (rawKey.includes('razorpay')) aliases.push('razorpay', 'payment gateway');
  if (rawKey.includes('cloudinary')) aliases.push('cloudinary', 'prescription uploads', 'image upload');
  if (rawKey.includes('recharts')) aliases.push('recharts', 'chart', 'analytics');
  if (rawKey.includes('redux')) aliases.push('redux', 'redux toolkit');
  if (rawKey.includes('mongo')) aliases.push('mongodb', 'mongoose', 'mongo');
  if (rawKey.includes('next')) aliases.push('next.js', 'nextjs', 'next');
  if (rawKey.includes('docker')) aliases.push('docker', 'container', 'dockerfile');
  if (rawKey.includes('git')) aliases.push('git', 'github');

  const matchesTerm = (text, term) => {
    if (!text || !term) return false;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, 'i').test(text);
  };

  // 2. Scan Projects first (candidate's concrete technical accomplishments)
  for (const proj of (projects || [])) {
    const bullets = Array.isArray(proj.bullets)
      ? proj.bullets
      : (proj.description ? proj.description.split(/\n+/) : []);

    for (const b of bullets) {
      const cleanBullet = (b || '').replace(/^[•\-\*–\s]+/, '').trim();
      if (!cleanBullet || cleanBullet.length < 15) continue;

      for (const alias of aliases) {
        if (matchesTerm(cleanBullet, alias)) {
          return cleanBullet;
        }
      }
    }
  }

  // 3. Scan Work Experience / Internships
  for (const exp of (experience || [])) {
    const bullets = Array.isArray(exp.bullets)
      ? exp.bullets
      : (exp.description ? exp.description.split(/\n+/) : []);

    for (const b of bullets) {
      const cleanBullet = (b || '').replace(/^[•\-\*–\s]+/, '').trim();
      if (!cleanBullet || cleanBullet.length < 15) continue;

      for (const alias of aliases) {
        if (matchesTerm(cleanBullet, alias)) {
          return cleanBullet;
        }
      }
    }
  }

  // 4. Check project titles or technologies lists if specific bullets didn't match
  for (const proj of (projects || [])) {
    const techs = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '';
    const projName = proj.name || proj.title || '';
    if (!projName) continue;

    for (const alias of aliases) {
      if (matchesTerm(techs, alias) || matchesTerm(projName, alias)) {
        return `Featured in project "${projName}" (${techs || skillName})`;
      }
    }
  }

  // 5. Inspect fallback quote from evidence
  if (fallbackQuote) {
    const cleanFallback = fallbackQuote.replace(/^[•\-\*–\s]+/, '').trim();
    // If the fallback quote is just a raw comma-separated dump of 4+ skills, don't repeat it verbatim
    if (cleanFallback.split(',').length >= 4 || cleanFallback.toLowerCase().startsWith('frontend & backend')) {
      if (projects.length > 0 && (projects[0].name || projects[0].title)) {
        return `Core technology stack applied in ${projects[0].name || projects[0].title}`;
      }
      return `Proficiency verified in candidate technical profile for ${skillName}`;
    }
    return cleanFallback;
  }

  return `Experience with ${skillName} documented in technical profile`;
}

/**
 * Generates rich, distinct, non-templated suggestions based on domain knowledge.
 */
export function generateDomainSuggestion(skillName, category, targetQuote = null) {
  const normKey = normalizeSkillKey(skillName);
  const rawKey = (skillName || '').trim().toLowerCase();

  // 1. Direct or alias catalog lookup
  const entry = DOMAIN_SKILL_CATALOG[rawKey] || DOMAIN_SKILL_CATALOG[normKey];
  if (entry) {
    if (category === 'improve_wording') return entry.improve_wording;
    if (category === 'highlight_existing_skill') return entry.highlight_existing;
    if (category === 'acquire_new_skill') return entry.acquire_new;
  }

  // 2. Domain classification fallback for skills not in direct catalog
  if (category === 'improve_wording') {
    if (/sql|db|mongo|postgres|mysql|redis|database|cassandra|dynamo/i.test(rawKey)) {
      return `Detail database indexing strategies, query execution plan tuning (EXPLAIN), and data consistency safeguards implemented with ${skillName}.`;
    }
    if (/react|vue|angular|svelte|tailwind|css|html|ui|frontend|webpack|vite/i.test(rawKey)) {
      return `Specify responsive design considerations, component lifecycle optimizations, and state management patterns established using ${skillName}.`;
    }
    if (/node|express|api|rest|fastapi|django|flask|spring|backend|server/i.test(rawKey)) {
      return `Detail request pipeline architecture, API response latency benchmarks, and rate-limiting or security guards implemented for ${skillName}.`;
    }
    if (/docker|kubernetes|aws|azure|gcp|ci|cd|pipeline|terraform|ansible/i.test(rawKey)) {
      return `Detail automated container orchestration, build pipeline stages, and production deployment resilience implemented with ${skillName}.`;
    }
    if (/test|jest|cypress|mocha|playwright|qa/i.test(rawKey)) {
      return `Quantify test coverage percentages, unit vs integration test boundaries, and automated regression safety achieved with ${skillName}.`;
    }
    return `Detail concrete architectural trade-offs, quantifiable performance outcomes, and production-readiness considerations achieved with ${skillName}.`;
  }

  if (category === 'highlight_existing_skill') {
    return `Make your practical, hands-on application of ${skillName} more prominent in your project accomplishments by citing specific technical challenges solved.`;
  }

  // acquire_new_skill
  return `Acquire hands-on familiarity with ${skillName} by building a targeted proof-of-concept module and documenting the implementation in your portfolio.`;
}

/**
 * Generates grounded, non-templated resume suggestions using Gemini AI when online,
 * with seamless fallback to the domain catalog when offline or under high demand.
 */
export async function generateResumeSuggestionsWithAI({
  aiProvider,
  analysis,
  jobDescription = {},
  projects = [],
  experience = [],
  skillMatches = []
}) {
  const suggestions = [];

  const matched = skillMatches.filter((m) => m.status === 'matched');
  const partiallyMatched = skillMatches.filter((m) => m.status === 'partially_matched');
  const missing = skillMatches.filter((m) => m.status === 'missing').slice(0, 3);

  // Pre-resolve project-specific quotes for all skills
  const quotesMap = {};
  for (const m of [...matched, ...partiallyMatched]) {
    const fallback = m.resume_evidence?.[0]?.quote || '';
    quotesMap[m.skill_name] = findBestResumeQuote(m.skill_name, projects, experience, fallback);
  }

  // 1. Try Gemini AI generation if available and not MockAIProvider
  const isRealAI = aiProvider && typeof aiProvider.generateStructuredJSON === 'function' && aiProvider.constructor?.name !== 'MockAIProvider';
  
  if (isRealAI) {
    try {
      const systemPrompt = `You are an expert technical resume coach for AI Placement Analyzer.
Your task is to provide honest, highly specific, diverse, and non-templated resume suggestions based strictly on the candidate's actual projects, work experience, and target role.

CRITICAL RULES:
1. NO GENERIC REPETITIVE TEMPLATES: Never repeat the same phrasing (like "Quantify measurable impact for <skill> (e.g., latency, throughput...)") across skills.
2. GROUNDED IN CONTEXT: For matched skills, look at the candidate's actual project/experience bullet where the skill was used. Suggest specific technical improvements, architecture enhancements, metrics, or patterns relevant to THAT specific technology (e.g. state management for React, middleware/error handling for Express, indexing/aggregations for MongoDB, utility class breakpoints for Tailwind CSS).
3. HONEST CATEGORIZATION (PRD FR-12):
   - "improve_wording": for verified matched skills where the candidate has existing project or work evidence.
   - "highlight_existing_skill": for partially matched skills where hands-on application can be made clearer.
   - "acquire_new_skill": for missing skills. NEVER suggest fabricating experience or adding unearned claims to the resume. Suggest a concrete portfolio project enhancement, proof-of-concept, or self-paced learning milestone. Target quote MUST be null.
4. JSON OUTPUT FORMAT:
{
  "suggestions": [
    {
      "category": "improve_wording | highlight_existing_skill | acquire_new_skill",
      "target_skill": "string",
      "target_quote": "string | null",
      "suggestion": "string",
      "classification": "evidence_based | general_guidance"
    }
  ]
}`;

      const userPrompt = `Target Role: ${jobDescription.title || analysis.title || 'Software Engineer'} (${jobDescription.company || 'Tech Company'})
Matched Skills: ${matched.map((s) => s.skill_name).join(', ') || 'None'}
Partially Matched Skills: ${partiallyMatched.map((s) => s.skill_name).join(', ') || 'None'}
Missing Skills: ${missing.map((s) => s.skill_name).join(', ') || 'None'}

Candidate Projects:
${JSON.stringify((projects || []).slice(0, 3), null, 2)}

Candidate Experience:
${JSON.stringify((experience || []).slice(0, 2), null, 2)}

Pre-Resolved Candidate Quotes:
${JSON.stringify(quotesMap, null, 2)}

Generate distinct, actionable, technology-specific resume recommendations.`;

      const aiResponse = await aiProvider.generateStructuredJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.2
      });

      if (aiResponse && Array.isArray(aiResponse.suggestions) && aiResponse.suggestions.length > 0) {
        for (const item of aiResponse.suggestions) {
          if (!item.target_skill || !item.suggestion) continue;
          
          const isMissing = item.category === 'acquire_new_skill' || missing.some((m) => m.skill_name.toLowerCase() === item.target_skill.toLowerCase());
          
          // Strict PRD FR-12 enforcement: Missing skills must never have a quote or claim unearned experience
          const quote = isMissing ? null : (quotesMap[item.target_skill] || item.target_quote || null);
          const category = isMissing
            ? 'acquire_new_skill'
            : (item.category === 'highlight_existing_skill' ? 'highlight_existing_skill' : 'improve_wording');
          const classification = isMissing ? 'general_guidance' : 'evidence_based';

          suggestions.push({
            category,
            target_skill: item.target_skill,
            target_quote: quote,
            suggestion: item.suggestion.trim(),
            classification
          });
        }

        if (suggestions.length > 0) {
          return suggestions;
        }
      }
    } catch (aiErr) {
      console.warn('[ResumeSuggestionsAI] Graceful fallback to domain catalog:', aiErr.message);
    }
  }

  // 2. Rich Domain-Aware Deterministic Catalog Fallback
  // A. Matched Skills -> improve_wording with distinct advice and resolved project quote
  for (const m of matched) {
    const quote = quotesMap[m.skill_name] || `Experience with ${m.skill_name}`;
    const suggestion = generateDomainSuggestion(m.skill_name, 'improve_wording', quote);
    suggestions.push({
      category: 'improve_wording',
      target_skill: m.skill_name,
      target_quote: quote,
      suggestion,
      classification: 'evidence_based'
    });
  }

  // B. Partially Matched Skills -> highlight_existing_skill
  for (const m of partiallyMatched) {
    const quote = quotesMap[m.skill_name] || m.resume_evidence?.[0]?.quote || '';
    const suggestion = generateDomainSuggestion(m.skill_name, 'highlight_existing_skill', quote);
    suggestions.push({
      category: 'highlight_existing_skill',
      target_skill: m.skill_name,
      target_quote: quote || null,
      suggestion,
      classification: 'evidence_based'
    });
  }

  // C. Missing Skills -> acquire_new_skill (Never fabricate experience, target_quote: null)
  for (const m of missing) {
    const suggestion = generateDomainSuggestion(m.skill_name, 'acquire_new_skill', null);
    suggestions.push({
      category: 'acquire_new_skill',
      target_skill: m.skill_name,
      target_quote: null,
      suggestion,
      classification: 'general_guidance'
    });
  }

  return suggestions;
}
