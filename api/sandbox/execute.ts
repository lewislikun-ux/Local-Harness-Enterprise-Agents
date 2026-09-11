import { dispatchSandboxTool, getVirtualFiles } from '../../lib/sandbox/executor.ts';
import { getInternalLogs } from '../../lib/logger.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { tool, args } = body;

  if (!tool) {
    return res.status(400).json({ error: 'Missing tool name in execution request.' });
  }

  try {
    const result = await dispatchSandboxTool({ tool, args: args || {} });
    return res.status(200).json({
      ...result,
      files: getVirtualFiles(),
      logs: getInternalLogs().slice(0, 50),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Execution error' });
  }
}
