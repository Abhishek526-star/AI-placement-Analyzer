BEGIN;

INSERT INTO public.skills (canonical_name, category, aliases, description) VALUES
  ('JavaScript', 'Programming Language', '["JS", "Javascript", "ECMAScript", "ES6", "ES6+"]'::jsonb, 'Core scripting language for web development.'),
  ('TypeScript', 'Programming Language', '["TS", "Typescript"]'::jsonb, 'Statically typed superset of JavaScript.'),
  ('Python', 'Programming Language', '["Python 3", "Python3", "Py"]'::jsonb, 'General-purpose programming language widely used in backend and AI.'),
  ('Java', 'Programming Language', '["Core Java", "Java 8", "Java 17", "JDK"]'::jsonb, 'Object-oriented programming language for enterprise backends.'),
  ('C++', 'Programming Language', '["CPP", "C Plus Plus"]'::jsonb, 'Systems and competitive programming language.'),
  ('React', 'Frontend', '["ReactJS", "React.js", "React 18", "React 19"]'::jsonb, 'Component-based JavaScript UI library.'),
  ('Next.js', 'Frontend', '["NextJS", "Next"]'::jsonb, 'Full-stack React framework with SSR and routing.'),
  ('Tailwind CSS', 'Frontend', '["Tailwind", "TailwindCSS"]'::jsonb, 'Utility-first CSS framework.'),
  ('Node.js', 'Backend', '["Node", "NodeJS", "Node JS"]'::jsonb, 'JavaScript runtime built on Chrome V8 engine.'),
  ('Express.js', 'Backend', '["Express", "ExpressJS"]'::jsonb, 'Minimalist web framework for Node.js.'),
  ('Spring Boot', 'Backend', '["SpringBoot", "Spring"]'::jsonb, 'Java-based framework for production microservices and APIs.'),
  ('FastAPI', 'Backend', '["Fast API"]'::jsonb, 'Modern Python web framework for building APIs.'),
  ('REST API Development', 'Backend', '["REST", "RESTful API", "RESTful APIs", "REST APIs"]'::jsonb, 'Designing and implementing RESTful HTTP services.'),
  ('SQL', 'Database', '["Structured Query Language", "RDBMS"]'::jsonb, 'Relational database querying and schema design.'),
  ('PostgreSQL', 'Database', '["Postgres", "PG", "psql"]'::jsonb, 'Open-source object-relational database system.'),
  ('MongoDB', 'Database', '["Mongo", "Mongo DB"]'::jsonb, 'NoSQL document-oriented database.'),
  ('Redis', 'Database', '["Redis Cache"]'::jsonb, 'In-memory key-value data store for caching and queues.'),
  ('Git', 'DevOps & Tools', '["GitHub", "GitLab", "Version Control"]'::jsonb, 'Distributed version control system.'),
  ('Docker', 'DevOps & Tools', '["Containerization", "Docker Compose"]'::jsonb, 'Platform for developing and running containerized applications.'),
  ('AWS', 'Cloud', '["Amazon Web Services", "AWS S3", "AWS EC2", "AWS Lambda"]'::jsonb, 'Cloud computing services platform.')
ON CONFLICT (canonical_name) DO UPDATE SET
  category = EXCLUDED.category,
  aliases = EXCLUDED.aliases,
  description = EXCLUDED.description;

COMMIT;
