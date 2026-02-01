import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Create Skill - Generates and deploys smart contracts from natural language
 *
 * "Build it for me"
 *
 * Takes: Natural language description of desired contract
 * Returns: Generated contract code, explanation, and deployment info
 */
export declare class CreateSkill extends BaseSkill {
    readonly name = "create";
    readonly description = "Creates and deploys smart contracts from natural language";
    readonly handledIntents: "create"[];
    private aiClient;
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    /**
     * Generate contract using AI
     */
    private generateContract;
    /**
     * Fallback to templates when AI fails
     */
    private generateFromTemplate;
    /**
     * Infer contract type from message
     */
    private inferContractType;
    /**
     * Extract requirements from user message
     */
    private extractRequirements;
    private getMultisigResult;
    private getTokenResult;
    private getNFTResult;
    private getEscrowResult;
    private getVaultResult;
    private getStakingResult;
    private getMultisigTemplate;
    private getTokenTemplate;
    private getNFTTemplate;
    private getEscrowTemplate;
    private getVaultTemplate;
}
//# sourceMappingURL=create.skill.d.ts.map