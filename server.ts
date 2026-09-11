import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { chatRouter } from './server/routes/chat.ts';
import { sandboxRouter } from './server/routes/sandbox.ts';
import { recordLog } from './lib/logger.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'Local-First Agent Harness',
  });
});

app.use('/api/chat', chatRouter);
app.use('/api/sandbox', sandboxRouter);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent Harness Server running on http://0.0.0.0:${PORT}`);
    recordLog({
      level: 'info',
      category: 'system',
      message: `Harness Dev Server active on port ${PORT}`,
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
