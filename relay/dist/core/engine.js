import { getIntentClassifier } from './intent-classifier.js';
import { getSkillRouter } from './skill-router.js';
import { getResponseGenerator } from './response-generator.js';
import { createErrorResponse, IntentType, createMessage, MessageSource, } from '../types/index.js';
/**
 * Relay Engine - Main orchestrator for the AI agent
 *
 * Pipeline:
 * 1. Receive message
 * 2. Classify intent
 * 3. Route to skill
 * 4. Execute skill
 * 5. Generate response
 */
export class RelayEngine {
    classifier;
    router;
    responseGenerator;
    config;
    constructor(config = {}) {
        this.config = {
            useAIResponses: false,
            debug: false,
            ...config,
        };
        this.classifier = getIntentClassifier();
        this.router = getSkillRouter();
        this.responseGenerator = getResponseGenerator();
    }
    /**
     * Process a message and return a response
     */
    async process(message) {
        const startTime = Date.now();
        try {
            this.log('Processing message:', message.text);
            // Step 1: Classify intent
            this.log('Classifying intent...');
            const intent = await this.classifier.classify(message.text);
            this.log('Intent classified:', intent.type, 'confidence:', intent.confidence);
            // Step 2: Create context
            const context = {
                intent,
                originalMessage: message.text,
                userId: message.userId,
                timestamp: message.timestamp,
                metadata: message.metadata,
            };
            // Step 3: Route to skill and execute
            this.log('Routing to skill...');
            const result = await this.router.route(context);
            this.log('Skill result:', result.success ? 'success' : 'error');
            // Step 4: Generate response
            this.log('Generating response...');
            const response = await this.responseGenerator.generate(result, intent.type, message.text);
            // Add total processing time
            response.processingTime = Date.now() - startTime;
            this.log('Total processing time:', response.processingTime, 'ms');
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Relay engine error:', errorMessage);
            return createErrorResponse(errorMessage, IntentType.UNKNOWN);
        }
    }
    /**
     * Simple text input processing (convenience method)
     */
    async chat(text, userId = 'anonymous', source = MessageSource.CLI) {
        const message = createMessage(text, userId, source);
        return this.process(message);
    }
    /**
     * Get available capabilities
     */
    getCapabilities() {
        return this.router.getSkillInfo();
    }
    /**
     * Health check
     */
    async healthCheck() {
        const components = {
            classifier: true,
            router: true,
            responseGenerator: true,
        };
        try {
            // Test classifier with a simple message
            await this.classifier.classify('test');
        }
        catch {
            components.classifier = false;
        }
        const allHealthy = Object.values(components).every(Boolean);
        return {
            status: allHealthy ? 'ok' : 'error',
            components,
        };
    }
    log(...args) {
        if (this.config.debug) {
            console.log('[Relay]', ...args);
        }
    }
}
/**
 * Create a new Relay engine instance
 */
export function createRelayEngine(config) {
    return new RelayEngine(config);
}
// Default singleton
let defaultEngine = null;
export function getRelayEngine() {
    if (!defaultEngine) {
        defaultEngine = new RelayEngine();
    }
    return defaultEngine;
}
//# sourceMappingURL=engine.js.map