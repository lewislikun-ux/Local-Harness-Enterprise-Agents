import express from 'express';
import type { Request, Response } from 'express';
import {
  dispatchSandboxTool,
  getVirtualFiles,
  getVirtualFile,
  writeVirtualFile,
  deleteVirtualFile,
} from '../../lib/sandbox/executor.ts';
import { getInternalLogs } from '../../lib/logger.ts';

export const sandboxRouter = express.Router();

// Execute a tool in the sandbox
sandboxRouter.post('/execute', async (req: Request, res: Response) => {
  const { tool, args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'Missing "tool" parameter in request.' });
  }

  const result = await dispatchSandboxTool({ tool, args: args || {} });
  const updatedFiles = getVirtualFiles();

  return res.json({
    ...result,
    files: updatedFiles,
    logs: getInternalLogs().slice(0, 50),
  });
});

// List all files in the virtual workspace
sandboxRouter.get('/files', (req: Request, res: Response) => {
  const files = getVirtualFiles();
  return res.json({ files });
});

// Read or create a file in the virtual workspace
sandboxRouter.get('/files/:path(*)', (req: Request, res: Response) => {
  const filePath = req.params.path;
  const file = getVirtualFile(filePath);
  if (!file) {
    return res.status(404).json({ error: `File "${filePath}" not found.` });
  }
  return res.json({ file });
});

sandboxRouter.post('/files', (req: Request, res: Response) => {
  const { path, content } = req.body;
  if (!path || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid path or content.' });
  }

  const file = writeVirtualFile(path, content);
  return res.json({ file, files: getVirtualFiles() });
});

sandboxRouter.delete('/files', (req: Request, res: Response) => {
  const filePath = (req.query.path as string) || req.body?.path;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing path parameter.' });
  }
  const success = deleteVirtualFile(filePath);
  return res.json({ success, files: getVirtualFiles() });
});

sandboxRouter.delete('/files/:path(*)', (req: Request, res: Response) => {
  const filePath = req.params.path;
  const success = deleteVirtualFile(filePath);
  return res.json({ success, files: getVirtualFiles() });
});

// Get harness logs
sandboxRouter.get('/logs', (req: Request, res: Response) => {
  return res.json({ logs: getInternalLogs() });
});
