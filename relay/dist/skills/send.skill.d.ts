import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Send Skill - Handles fund transfers and payments
 *
 * "Move money"
 *
 * Takes: Amount, recipient (address or ENS), optional currency
 * Returns: Transaction preparation, confirmation request, execution status
 */
export declare class SendSkill extends BaseSkill {
    readonly name = "send";
    readonly description = "Handles cryptocurrency transfers and payments";
    readonly handledIntents: "send"[];
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    private resolveRecipient;
    private calculateEquivalents;
    private getWarnings;
    private assessTransferRisk;
}
//# sourceMappingURL=send.skill.d.ts.map