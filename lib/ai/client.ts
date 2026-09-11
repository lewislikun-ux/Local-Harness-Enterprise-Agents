import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

/**
 * Lazy initialization of GoogleGenAI SDK client.
 * Server-only utility respecting user secrets and telemetry requirements.
 */
export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please ensure GEMINI_API_KEY is present or provided in Settings.'
    );
  }

  // If a custom API key is passed, create a fresh instance
  if (customApiKey) {
    return new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}
