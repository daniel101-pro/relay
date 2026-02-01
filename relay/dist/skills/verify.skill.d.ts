import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Verify Skill - Verifies safety and legitimacy of wallets, contracts, and claims
 *
 * "Can I trust this?"
 *
 * Takes: wallet address, contract address, or claim to verify
 * Returns: Trust assessment with on-chain evidence
 */
export declare class VerifySkill extends BaseSkill {
    readonly name = "verify";
    readonly description = "Verifies the safety and legitimacy of wallets and contracts";
    readonly handledIntents: "verify"[];
    private explorer;
    private provider;
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    /**
     * Verify an address (wallet or contract)
     */
    private verifyAddress;
    /**
     * Verify a transaction
     */
    private verifyTransaction;
    /**
     * Check account age based on transaction history
     */
    private checkAccountAge;
    /**
     * Check activity patterns for suspicious behavior
     */
    private checkActivityPatterns;
    /**
     * Check balance
     */
    private checkBalance;
    /**
     * Check contract verification status
     */
    private checkContractVerification;
    /**
     * Check contract security indicators
     */
    private checkContractSecurity;
    /**
     * Analyze function call for suspicious patterns
     */
    private analyzeFunctionCall;
    /**
     * Calculate overall risk from checks
     */
    private calculateOverallRisk;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Generate verdict text
     */
    private generateVerdict;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
}
//# sourceMappingURL=verify.skill.d.ts.map