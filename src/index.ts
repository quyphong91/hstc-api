import { createServer } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Create and start server
const app = createServer();

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║                                                ║');
  console.log('║       🚀 HSTC API Server Running              ║');
  console.log('║                                                ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Server:     http://${HOST}:${PORT}`);
  console.log(`🏥 Health:     http://${HOST}:${PORT}/api/v1/health`);
  console.log(`📚 Docs:       http://${HOST}:${PORT}/api/v1/docs`);
  console.log('');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Version:     1.0.0`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⏹️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});
