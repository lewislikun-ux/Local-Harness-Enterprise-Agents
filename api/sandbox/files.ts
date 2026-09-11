import {
  getVirtualFiles,
  getVirtualFile,
  writeVirtualFile,
  deleteVirtualFile,
} from '../../lib/sandbox/executor.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    const filePath = (req.query?.path as string) || (req.query?.filePath as string);
    if (filePath) {
      const file = getVirtualFile(filePath);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(200).json({ file });
    }
    return res.status(200).json({ files: getVirtualFiles() });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { path, content } = body;
    if (!path || typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing path or content in request.' });
    }
    const file = writeVirtualFile(path, content);
    return res.status(200).json({ file, files: getVirtualFiles() });
  }

  if (req.method === 'DELETE') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const filePath =
      (req.query?.path as string) ||
      (req.query?.filePath as string) ||
      (body?.path as string);
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    const deleted = deleteVirtualFile(filePath);
    return res.status(200).json({ deleted, files: getVirtualFiles() });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
