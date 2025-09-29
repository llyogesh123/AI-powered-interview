const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const User = require('../models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const sampleQuestions = [
  // Easy Questions - JavaScript
  {
    text: "What is the difference between let, const, and var in JavaScript?",
    difficulty: "easy",
    category: "javascript",
    timeLimit: 20,
    keywords: ["let", "const", "var", "variables", "scope"],
    sampleAnswer: "var has function scope and can be redeclared, let has block scope and can be reassigned but not redeclared, const has block scope and cannot be reassigned or redeclared.",
    scoringCriteria: [
      { criterion: "Mentions scope differences", weight: 40, description: "Explains function vs block scope" },
      { criterion: "Explains redeclaration rules", weight: 30, description: "Covers var redeclaration vs let/const" },
      { criterion: "Mentions reassignment", weight: 30, description: "Explains const immutability" }
    ]
  },
  {
    text: "What is the difference between == and === in JavaScript?",
    difficulty: "easy",
    category: "javascript",
    timeLimit: 20,
    keywords: ["equality", "comparison", "type coercion"],
    sampleAnswer: "== performs type coercion before comparison, while === performs strict comparison without type conversion.",
    scoringCriteria: [
      { criterion: "Mentions type coercion", weight: 50, description: "Explains == type conversion" },
      { criterion: "Explains strict comparison", weight: 50, description: "Covers === no conversion behavior" }
    ]
  },
  {
    text: "What is a React component and how does it differ from a regular function?",
    difficulty: "easy",
    category: "react",
    timeLimit: 20,
    keywords: ["react", "component", "jsx", "function"],
    sampleAnswer: "A React component is a reusable piece of UI that returns JSX. Unlike regular functions, React components can manage state and lifecycle, and must return JSX elements.",
    scoringCriteria: [
      { criterion: "Defines React component", weight: 40, description: "Explains component concept" },
      { criterion: "Mentions JSX", weight: 30, description: "Covers JSX return requirement" },
      { criterion: "Mentions state/lifecycle", weight: 30, description: "Explains React-specific features" }
    ]
  },
  {
    text: "What is the purpose of the useState hook in React?",
    difficulty: "easy",
    category: "react",
    timeLimit: 20,
    keywords: ["react", "useState", "hook", "state"],
    sampleAnswer: "useState is a React hook that allows functional components to manage local state. It returns an array with the current state value and a function to update it.",
    scoringCriteria: [
      { criterion: "Explains state management", weight: 40, description: "Covers state purpose" },
      { criterion: "Mentions return array", weight: 30, description: "Explains useState return structure" },
      { criterion: "Functional components", weight: 30, description: "Mentions functional component context" }
    ]
  },

  // Medium Questions
  {
    text: "Explain the concept of closures in JavaScript with an example.",
    difficulty: "medium",
    category: "javascript",
    timeLimit: 60,
    keywords: ["closures", "scope", "lexical", "functions"],
    sampleAnswer: "A closure is when an inner function has access to variables from its outer function's scope even after the outer function has returned. Example: function outer(x) { return function inner(y) { return x + y; }; }",
    scoringCriteria: [
      { criterion: "Defines closures", weight: 30, description: "Explains closure concept" },
      { criterion: "Mentions scope access", weight: 30, description: "Covers variable access from outer scope" },
      { criterion: "Provides example", weight: 40, description: "Shows working code example" }
    ]
  },
  {
    text: "What is the Virtual DOM in React and why is it useful?",
    difficulty: "medium",
    category: "react",
    timeLimit: 60,
    keywords: ["virtual dom", "performance", "reconciliation", "diff"],
    sampleAnswer: "The Virtual DOM is a JavaScript representation of the actual DOM. React uses it to efficiently update the UI by comparing (diffing) the virtual DOM trees and only updating the parts that changed, improving performance.",
    scoringCriteria: [
      { criterion: "Defines Virtual DOM", weight: 30, description: "Explains what Virtual DOM is" },
      { criterion: "Mentions performance", weight: 35, description: "Covers performance benefits" },
      { criterion: "Explains diffing process", weight: 35, description: "Describes how React compares and updates" }
    ]
  },
  {
    text: "How do you handle state management in a React application?",
    difficulty: "medium",
    category: "react",
    timeLimit: 60,
    keywords: ["state management", "redux", "context", "props"],
    sampleAnswer: "State can be managed locally with useState/useReducer, shared via props drilling, React Context for component tree sharing, or external libraries like Redux/Zustand for global state.",
    scoringCriteria: [
      { criterion: "Mentions local state", weight: 25, description: "Covers component-level state" },
      { criterion: "Mentions props/context", weight: 35, description: "Explains React's built-in sharing methods" },
      { criterion: "Mentions external libraries", weight: 40, description: "Covers Redux or similar solutions" }
    ]
  },
  {
    text: "Explain the differences between REST and GraphQL APIs.",
    difficulty: "medium",
    category: "general",
    timeLimit: 60,
    keywords: ["rest", "graphql", "api", "query", "endpoints"],
    sampleAnswer: "REST uses multiple endpoints with fixed data structures and HTTP methods. GraphQL uses a single endpoint where clients specify exactly what data they need, reducing over-fetching and under-fetching.",
    scoringCriteria: [
      { criterion: "Explains REST structure", weight: 30, description: "Covers REST endpoints and methods" },
      { criterion: "Explains GraphQL queries", weight: 40, description: "Describes GraphQL single endpoint and custom queries" },
      { criterion: "Mentions data fetching efficiency", weight: 30, description: "Covers over/under-fetching issues" }
    ]
  },

  // Hard Questions
  {
    text: "Implement a debounce function in JavaScript and explain when you would use it.",
    difficulty: "hard",
    category: "javascript",
    timeLimit: 120,
    keywords: ["debounce", "throttle", "performance", "events"],
    sampleAnswer: "function debounce(func, delay) { let timeoutId; return function(...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); }; } Used for search inputs, resize events, or API calls to limit frequency.",
    scoringCriteria: [
      { criterion: "Implements debounce correctly", weight: 50, description: "Shows working debounce function" },
      { criterion: "Explains use cases", weight: 30, description: "Provides practical examples" },
      { criterion: "Mentions performance benefits", weight: 20, description: "Explains why debouncing helps" }
    ]
  },
  {
    text: "Explain React's reconciliation process and how keys work in lists.",
    difficulty: "hard",
    category: "react",
    timeLimit: 120,
    keywords: ["reconciliation", "keys", "diff algorithm", "virtual dom"],
    sampleAnswer: "Reconciliation is React's process of comparing Virtual DOM trees to determine minimal changes. Keys help React identify which list items changed, moved, or were added/removed, enabling efficient updates instead of re-rendering entire lists.",
    scoringCriteria: [
      { criterion: "Explains reconciliation", weight: 40, description: "Describes the diff process" },
      { criterion: "Explains key purpose", weight: 40, description: "Covers how keys help identify elements" },
      { criterion: "Mentions performance impact", weight: 20, description: "Explains efficiency benefits" }
    ]
  },
  {
    text: "Design a scalable Node.js application architecture for handling high traffic.",
    difficulty: "hard",
    category: "nodejs",
    timeLimit: 120,
    keywords: ["scalability", "architecture", "microservices", "load balancing"],
    sampleAnswer: "Use microservices architecture with load balancers, implement caching (Redis), use clustering/PM2, database sharding, CDN for static assets, message queues for async processing, and monitoring/logging systems.",
    scoringCriteria: [
      { criterion: "Mentions architectural patterns", weight: 35, description: "Covers microservices or similar" },
      { criterion: "Discusses scaling strategies", weight: 35, description: "Load balancing, clustering, etc." },
      { criterion: "Mentions infrastructure components", weight: 30, description: "Caching, queues, monitoring" }
    ]
  },
  {
    text: "How would you optimize a React application for performance?",
    difficulty: "hard",
    category: "react",
    timeLimit: 120,
    keywords: ["performance", "optimization", "memoization", "code splitting"],
    sampleAnswer: "Use React.memo, useMemo, useCallback for memoization; implement code splitting with React.lazy; optimize bundle size; use virtual scrolling for large lists; optimize images and assets; minimize re-renders with proper state structure.",
    scoringCriteria: [
      { criterion: "Mentions memoization techniques", weight: 35, description: "React.memo, useMemo, useCallback" },
      { criterion: "Discusses code splitting", weight: 30, description: "Lazy loading and bundle optimization" },
      { criterion: "Covers additional optimizations", weight: 35, description: "Virtual scrolling, assets, re-render optimization" }
    ]
  },

  // Database Questions
  {
    text: "What is the difference between SQL and NoSQL databases?",
    difficulty: "medium",
    category: "database",
    timeLimit: 60,
    keywords: ["sql", "nosql", "relational", "document", "schema"],
    sampleAnswer: "SQL databases are relational with fixed schemas and ACID compliance. NoSQL databases are non-relational, schema-flexible, and designed for horizontal scaling with different data models (document, key-value, graph).",
    scoringCriteria: [
      { criterion: "Explains SQL characteristics", weight: 40, description: "Relational, schema, ACID" },
      { criterion: "Explains NoSQL characteristics", weight: 40, description: "Flexible schema, scaling, data models" },
      { criterion: "Mentions use cases", weight: 20, description: "When to use each type" }
    ]
  },

  // Algorithm Questions
  {
    text: "Explain the time complexity of common sorting algorithms.",
    difficulty: "medium",
    category: "algorithms",
    timeLimit: 60,
    keywords: ["time complexity", "sorting", "big o", "algorithms"],
    sampleAnswer: "Bubble Sort: O(n²), Quick Sort: O(n log n) average/O(n²) worst, Merge Sort: O(n log n), Heap Sort: O(n log n). Merge and Heap sort have consistent performance while Quick sort is typically fastest in practice.",
    scoringCriteria: [
      { criterion: "Lists multiple algorithms", weight: 40, description: "Covers 3+ sorting algorithms" },
      { criterion: "Provides correct complexity", weight: 40, description: "Accurate Big O notation" },
      { criterion: "Mentions best/worst cases", weight: 20, description: "Discusses performance variations" }
    ]
  }
];

const sampleUsers = [
  {
    username: "admin",
    email: "admin@aiinterview.com",
    password: "admin123",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
    department: "IT"
  },
  {
    username: "interviewer1",
    email: "john.doe@aiinterview.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    role: "interviewer",
    department: "Engineering"
  },
  {
    username: "hr1",
    email: "jane.smith@aiinterview.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Smith",
    role: "hr",
    department: "Human Resources"
  }
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await Question.deleteMany({});
    await User.deleteMany({});

    // Seed questions
    console.log('Seeding questions...');
    const createdQuestions = await Question.insertMany(sampleQuestions);
    console.log(`✅ Created ${createdQuestions.length} questions`);

    // Seed users
    console.log('Seeding users...');
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@aiinterview.com / admin123');
    console.log('Interviewer: john.doe@aiinterview.com / password123');
    console.log('HR: jane.smith@aiinterview.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
connectDB().then(seedDatabase);