import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Proof Skill - Generates receipts and proof of transactions
 *
 * "Show me a receipt"
 *
 * Takes: Transaction hash or recent transaction reference
 * Returns: Human-readable, shareable receipt with verification link
 */
export declare class ProofSkill extends BaseSkill {
    readonly name = "proof";
    readonly description = "Generates receipts and proof of blockchain transactions";
    readonly handledIntents: "proof"[];
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    private generateReceipt;
}
//# sourceMappingURL=proof.skill.d.ts.map