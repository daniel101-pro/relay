import OpenAI from 'openai';
import { z } from 'zod';

/**
 * OpenAI client wrapper with typed methods for Relay
 */
export class AIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = model;
  }

  /**
   * Get a JSON-structured completion
   */
  async getStructuredCompletion<T>(
    systemPrompt: string,
    userMessage: string,
    schema: z.ZodSchema<T>,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<T> {
    const { temperature = 0.1, maxTokens = 1000 } = options;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    return schema.parse(parsed);
  }

  /**
   * Get a text completion
   */
  async getCompletion(
    systemPrompt: string,
    userMessage: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000 } = options;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return content;
  }

  /**
   * Get a completion with conversation history
   */
  async getChatCompletion(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000 } = options;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return content;
  }
}

// Default singleton instance
let defaultClient: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!defaultClient) {
    defaultClient = new AIClient();
  }
  return defaultClient;
}

export function initAIClient(apiKey: string, model?: string): AIClient {
  defaultClient = new AIClient(apiKey, model);
  return defaultClient;
}
