import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Explain Skill - Explains transactions, addresses, and blockchain activity
 *
 * "What just happened?"
 *
 * Takes: tx hash, wallet address, or blockchain query
 * Returns: Plain English explanation with risk assessment
 */
export declare class ExplainSkill extends BaseSkill {
    readonly name = "explain";
    readonly description = "Explains blockchain transactions and addresses in plain English";
    readonly handledIntents: "explain"[];
    private explorer;
    private provider;
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    /**
     * Explain a transaction
     */
    private explainTransaction;
    /**
     * Format transaction data into a result
     */
    private formatTransactionResult;
    /**
     * Determine the type of transaction
     */
    private determineTransactionType;
    /**
     * Generate human-readable explanation
     */
    private generateTransactionExplanation;
    /**
     * Assess transaction risk
     */
    private assessTransactionRisk;
    /**
     * Explain an address
     */
    private explainAddress;
    /**
     * Assess activity level based on transaction count
     */
    private assessActivityLevel;
    /**
     * Assess address risk
     */
    private assessAddressRisk;
    /**
     * Explain an ENS name
     */
    private explainENS;
}
//# sourceMappingURL=explain.skill.d.ts.map