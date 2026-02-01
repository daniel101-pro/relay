/**
 * Abstract base class for all Relay skills
 */
export class BaseSkill {
    /**
     * Check if this skill can handle the given intent
     */
    canHandle(intentType) {
        return this.handledIntents.includes(intentType);
    }
    /**
     * Validate input before execution
     * Override in subclass for specific validation
     */
    async validate(context) {
        return { valid: true };
    }
    /**
     * Helper to create a successful result
     */
    success(data, options = {}) {
        return {
            success: true,
            data,
            riskLevel: options.riskLevel,
            confidence: options.confidence,
            warnings: options.warnings || [],
        };
    }
    /**
     * Helper to create an error result
     */
    error(message, warnings = []) {
        return {
            success: false,
            error: message,
            warnings,
        };
    }
}
//# sourceMappingURL=base-skill.js.map