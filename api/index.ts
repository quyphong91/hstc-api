import { createServer } from '../src/server.js';

// Create Express app without starting server
const app = createServer();

// Export for Vercel serverless
export default app;
