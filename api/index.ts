export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    name: 'Local-First Agent Harness API',
    status: 'ok',
    endpoints: [
      '/api/chat',
      '/api/health',
      '/api/sandbox/execute',
      '/api/sandbox/files',
      '/api/sandbox/logs',
    ],
  });
}
