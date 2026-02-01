import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Chat Skill - The brain of Relay
 *
 * Handles:
 * - Greetings and general conversation
 * - ANY question (crypto, life, whatever)
 * - Teaching crypto concepts in Gen Z speak
 * - Understanding messy/unclear messages
 * - Redirecting to specific skills when needed
 */
export declare class ChatSkill extends BaseSkill {
    name: string;
    description: string;
    handledIntents: "unknown"[];
    private aiClient;
    constructor();
    validate(_context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    private isGreeting;
    private isHelpRequest;
    private isCapabilityQuestion;
    private isCryptoQuestion;
    private handleGreeting;
    private handleHelp;
    private handleCapabilities;
    private handleCryptoEducation;
    private handleWithAI;
    private handleUnknown;
}
//# sourceMappingURL=chat.skill.d.ts.map