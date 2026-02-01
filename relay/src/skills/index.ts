// Base skill class
export { BaseSkill, type SkillRegistry } from './base-skill.js';

// Skill implementations
export { ExplainSkill } from './explain.skill.js';
export { VerifySkill } from './verify.skill.js';
export { CreateSkill } from './create.skill.js';
export { SendSkill } from './send.skill.js';
export { ProofSkill } from './proof.skill.js';
export { SafetySkill } from './safety.skill.js';
export { WalletSkill } from './wallet.skill.js';
export { ChatSkill } from './chat.skill.js';

// All skills for easy registration
import { ExplainSkill } from './explain.skill.js';
import { VerifySkill } from './verify.skill.js';
import { CreateSkill } from './create.skill.js';
import { SendSkill } from './send.skill.js';
import { ProofSkill } from './proof.skill.js';
import { SafetySkill } from './safety.skill.js';
import { WalletSkill } from './wallet.skill.js';
import { ChatSkill } from './chat.skill.js';
import { BaseSkill } from './base-skill.js';

/**
 * Get all available skills
 */
export function getAllSkills(): BaseSkill[] {
  return [
    new ExplainSkill(),
    new VerifySkill(),
    new CreateSkill(),
    new SendSkill(),
    new ProofSkill(),
    new SafetySkill(),
    new WalletSkill(),  // Wallet management
    new ChatSkill(),    // Handles unknown intents and general chat
  ];
}
