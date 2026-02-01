import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Safety Skill - Proactive security monitoring and scam detection
 *
 * "Protect me"
 *
 * Takes: Suspicious activity, potential scam, security question
 * Returns: Risk assessment, warnings, recommended actions
 */
export declare class SafetySkill extends BaseSkill {
    readonly name = "safety";
    readonly description = "Provides security monitoring and scam detection";
    readonly handledIntents: "safety"[];
    validate(_context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    private analyzeSecurityConcern;
    private checkScamPatterns;
    private checkAddresses;
    private calculateOverallRisk;
    private getRecommendations;
    private getEducationalInfo;
}
//# sourceMappingURL=safety.skill.d.ts.map