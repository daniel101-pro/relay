import { BaseSkill, SkillRegistry, getAllSkills } from '../skills/index.js';
import {
  IntentType,
  IntentContext,
  SkillResult,
  ClassifiedIntent,
} from '../types/index.js';

/**
 * Skill Router - Routes classified intents to appropriate skill handlers
 */
export class SkillRouter {
  private skills: SkillRegistry;

  constructor(skills?: BaseSkill[]) {
    this.skills = new Map();

    // Register provided skills or default to all skills
    const skillsToRegister = skills || getAllSkills();
    for (const skill of skillsToRegister) {
      this.registerSkill(skill);
    }
  }

  /**
   * Register a skill
   */
  registerSkill(skill: BaseSkill): void {
    this.skills.set(skill.name, skill);
  }

  /**
   * Unregister a skill
   */
  unregisterSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  /**
   * Get a skill by name
   */
  getSkill(name: string): BaseSkill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all registered skills
   */
  getAllSkills(): BaseSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Find the best skill to handle an intent
   */
  findSkillForIntent(intentType: IntentType): BaseSkill | null {
    for (const skill of this.skills.values()) {
      if (skill.canHandle(intentType)) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Route an intent to the appropriate skill and execute it
   */
  async route(context: IntentContext): Promise<SkillResult> {
    const { intent } = context;

    // Find skill for this intent (including UNKNOWN which routes to ChatSkill)
    const skill = this.findSkillForIntent(intent.type);

    if (!skill) {
      return {
        success: false,
        error: `No handler available for ${intent.type} requests.`,
        warnings: [],
      };
    }

    // Validate input
    const validation = await skill.validate(context);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid input',
        warnings: [],
      };
    }

    // Execute skill
    try {
      return await skill.execute(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Error executing ${skill.name}: ${message}`,
        warnings: [],
      };
    }
  }

  /**
   * Get skill info for help/capabilities display
   */
  getSkillInfo(): Array<{ name: string; description: string; intents: string[] }> {
    return Array.from(this.skills.values()).map((skill) => ({
      name: skill.name,
      description: skill.description,
      intents: skill.handledIntents,
    }));
  }
}

// Default singleton
let defaultRouter: SkillRouter | null = null;

export function getSkillRouter(): SkillRouter {
  if (!defaultRouter) {
    defaultRouter = new SkillRouter();
  }
  return defaultRouter;
}
