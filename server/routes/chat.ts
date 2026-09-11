import { Router, Request, Response } from 'express';
import { getLLMProvider } from '../../lib/ai/provider.ts';
import { getVirtualFiles } from '../../lib/sandbox/executor.ts';
import { getInternalLogs, recordLog } from '../../lib/logger.ts';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  const { messages, agent, settings } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array.' });
  }

  const agentModel = agent?.model || settings?.defaultModel;
  const agentTemperature = agent?.temperature ?? 0.3;
  const systemInstruction = agent?.systemPrompt;
  const providerName = settings?.provider || 'gemini';
  const customApiKey = settings?.apiKey;

  recordLog({
    level: 'info',
    category: 'system',
    message: `Received chat request for agent "${agent?.name || 'Default'}" (Provider: ${providerName}, Model: ${agentModel})`,
    metadata: { messageCount: messages.length, agentId: agent?.id },
  });

  try {
    const provider = getLLMProvider(providerName);

    const result = await provider.generateChat({
      messages,
      model: agentModel,
      temperature: agentTemperature,
      systemInstruction,
      customApiKey,
      toolsEnabled: settings?.autoExecuteTools !== false,
    });

    const workspaceFiles = getVirtualFiles();
    const recentLogs = getInternalLogs().slice(0, 50);

    return res.json({
      content: result.content,
      toolCalls: result.toolCalls,
      model: result.model,
      files: workspaceFiles,
      logs: recentLogs,
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Agent harness orchestration error';
    recordLog({
      level: 'error',
      category: 'system',
      message: `Chat orchestration failed: ${errorMsg}`,
      metadata: { error: String(err) },
    });

    return res.status(500).json({
      error: errorMsg,
      files: getVirtualFiles(),
      logs: getInternalLogs().slice(0, 50),
    });
  }
});
