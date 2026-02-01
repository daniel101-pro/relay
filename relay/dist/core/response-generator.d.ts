import { AIClient } from '../ai/openai.js';
import { IntentType, SkillResult, RelayResponse } from '../types/index.js';
/**
 * Response Generator - Converts skill results into human-friendly chat messages
 */
export declare class ResponseGenerator {
    private aiClient;
    private useAI;
    constructor(aiClient?: AIClient, useAI?: boolean);
    /**
     * Generate a human-friendly response from skill result
     */
    generate(result: SkillResult, intentType: IntentType, originalMessage: string): Promise<RelayResponse>;
    /**
     * Generate response using AI for more natural language
     */
    private generateWithAI;
    /**
     * Generate response using templates (faster, no AI call)
     */
    private generateWithTemplates;
    private generateExplainResponse;
    private generateVerifyResponse;
    private generateCreateResponse;
    private generateSendResponse;
    private generateProofResponse;
    private generateSafetyResponse;
    private getRiskLabel;
    private getSuggestions;
}
export declare function getResponseGenerator(): ResponseGenerator;
//# sourceMappingURL=response-generator.d.ts.map