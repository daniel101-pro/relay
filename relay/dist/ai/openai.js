import OpenAI from 'openai';
/**
 * OpenAI client wrapper with typed methods for Relay
 */
export class AIClient {
    client;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
        this.model = model;
    }
    /**
     * Get a JSON-structured completion
     */
    async getStructuredCompletion(systemPrompt, userMessage, schema, options = {}) {
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
    async getCompletion(systemPrompt, userMessage, options = {}) {
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
    async getChatCompletion(systemPrompt, messages, options = {}) {
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
let defaultClient = null;
export function getAIClient() {
    if (!defaultClient) {
        defaultClient = new AIClient();
    }
    return defaultClient;
}
export function initAIClient(apiKey, model) {
    defaultClient = new AIClient(apiKey, model);
    return defaultClient;
}
//# sourceMappingURL=openai.js.map