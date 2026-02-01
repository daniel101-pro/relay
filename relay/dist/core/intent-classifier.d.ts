import { AIClient } from '../ai/openai.js';
import { ClassifiedIntent } from '../types/index.js';
/**
 * Intent Classifier - Smart classification with fallbacks
 */
export declare class IntentClassifier {
    private aiClient;
    constructor(aiClient?: AIClient);
    /**
     * Classify user message intent
     */
    classify(message: string): Promise<ClassifiedIntent>;
    /**
     * Quick pattern-based classification (no AI call needed)
     */
    private quickClassify;
    /**
     * Create an unknown intent response
     */
    private createUnknownIntent;
    /**
     * Extract entities from message
     */
    private extractEntities;
    /**
     * Quick check if message likely contains blockchain entities
     */
    static hasBlockchainEntities(message: string): boolean;
    /**
     * Extract entities using regex (fast, no AI)
     */
    static extractEntitiesQuick(message: string): {
        addresses: string[];
        transactionHashes: string[];
        ensNames: string[];
    };
}
export declare function getIntentClassifier(): IntentClassifier;
//# sourceMappingURL=intent-classifier.d.ts.map