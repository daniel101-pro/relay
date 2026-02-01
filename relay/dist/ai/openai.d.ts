import { z } from 'zod';
/**
 * OpenAI client wrapper with typed methods for Relay
 */
export declare class AIClient {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    /**
     * Get a JSON-structured completion
     */
    getStructuredCompletion<T>(systemPrompt: string, userMessage: string, schema: z.ZodSchema<T>, options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<T>;
    /**
     * Get a text completion
     */
    getCompletion(systemPrompt: string, userMessage: string, options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<string>;
    /**
     * Get a completion with conversation history
     */
    getChatCompletion(systemPrompt: string, messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>, options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<string>;
}
export declare function getAIClient(): AIClient;
export declare function initAIClient(apiKey: string, model?: string): AIClient;
//# sourceMappingURL=openai.d.ts.map