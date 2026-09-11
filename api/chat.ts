import { getLLMProvider } from '../lib/ai/provider.ts';
import { getVirtualFiles } from '../lib/sandbox/executor.ts';
import { getInternalLogs, recordLog } from '../lib/logger.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { messages, agent, settings } = body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array.' });
  }

  const agentModel = agent?.model || settings?.defaultModel;
  const providerName = settings?.provider || 'gemini';
  const customApiKey = settings?.apiKey;

  recordLog({
    level: 'info',
    category: 'genai',
    message: `Serverless Chat: Dispatching request for agent '${agent?.name || 'Default'}' [${agentModel}]`,
  });

  try {
    const provider = getLLMProvider(providerName);
    const result = await provider.generateChat({
      messages,
      model: agentModel,
      temperature: agent?.temperature ?? 0.3,
      systemInstruction: agent?.systemPrompt,
      customApiKey,
      toolsEnabled: settings?.autoExecuteTools !== false,
    });

    const workspaceFiles = getVirtualFiles();
    const recentLogs = getInternalLogs().slice(0, 50);

    return res.status(200).json({
      content: result.content,
      toolCalls: result.toolCalls,
      model: result.model,
      files: workspaceFiles,
      logs: recentLogs,
    });
  } catch (err: any) {
    console.error('Chat error in serverless handler:', err);
    recordLog({
      level: 'error',
      category: 'genai',
      message: `Serverless chat error: ${err?.message || 'Unknown error'}`,
    });
    return res.status(500).json({
      error: err?.message || 'An error occurred during agent orchestration.',
    });
  }
}
