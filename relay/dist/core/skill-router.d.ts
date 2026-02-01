import { BaseSkill } from '../skills/index.js';
import { IntentType, IntentContext, SkillResult } from '../types/index.js';
/**
 * Skill Router - Routes classified intents to appropriate skill handlers
 */
export declare class SkillRouter {
    private skills;
    constructor(skills?: BaseSkill[]);
    /**
     * Register a skill
     */
    registerSkill(skill: BaseSkill): void;
    /**
     * Unregister a skill
     */
    unregisterSkill(name: string): boolean;
    /**
     * Get a skill by name
     */
    getSkill(name: string): BaseSkill | undefined;
    /**
     * Get all registered skills
     */
    getAllSkills(): BaseSkill[];
    /**
     * Find the best skill to handle an intent
     */
    findSkillForIntent(intentType: IntentType): BaseSkill | null;
    /**
     * Route an intent to the appropriate skill and execute it
     */
    route(context: IntentContext): Promise<SkillResult>;
    /**
     * Get skill info for help/capabilities display
     */
    getSkillInfo(): Array<{
        name: string;
        description: string;
        intents: string[];
    }>;
}
export declare function getSkillRouter(): SkillRouter;
//# sourceMappingURL=skill-router.d.ts.map