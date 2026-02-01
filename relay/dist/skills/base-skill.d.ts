import { IntentType, IntentContext, SkillResult, RiskLevel } from '../types/index.js';
/**
 * Abstract base class for all Relay skills
 */
export declare abstract class BaseSkill {
    /** Unique identifier for this skill */
    abstract readonly name: string;
    /** Human-readable description */
    abstract readonly description: string;
    /** Intent types this skill handles */
    abstract readonly handledIntents: IntentType[];
    /**
     * Check if this skill can handle the given intent
     */
    canHandle(intentType: IntentType): boolean;
    /**
     * Validate input before execution
     * Override in subclass for specific validation
     */
    validate(context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Execute the skill
     */
    abstract execute(context: IntentContext): Promise<SkillResult>;
    /**
     * Helper to create a successful result
     */
    protected success(data: Record<string, unknown>, options?: {
        riskLevel?: RiskLevel;
        confidence?: number;
        warnings?: string[];
    }): SkillResult;
    /**
     * Helper to create an error result
     */
    protected error(message: string, warnings?: string[]): SkillResult;
}
/**
 * Skill registry type
 */
export type SkillRegistry = Map<string, BaseSkill>;
//# sourceMappingURL=base-skill.d.ts.map