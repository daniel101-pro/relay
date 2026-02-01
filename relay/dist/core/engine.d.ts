import { IncomingMessage, RelayResponse, MessageSource } from '../types/index.js';
export interface RelayEngineConfig {
    /** Use AI for response generation (more natural but slower) */
    useAIResponses?: boolean;
    /** Log debug information */
    debug?: boolean;
}
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
export declare class RelayEngine {
    private classifier;
    private router;
    private responseGenerator;
    private config;
    constructor(config?: RelayEngineConfig);
    /**
     * Process a message and return a response
     */
    process(message: IncomingMessage): Promise<RelayResponse>;
    /**
     * Simple text input processing (convenience method)
     */
    chat(text: string, userId?: string, source?: MessageSource): Promise<RelayResponse>;
    /**
     * Get available capabilities
     */
    getCapabilities(): Array<{
        name: string;
        description: string;
        intents: string[];
    }>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: 'ok' | 'error';
        components: Record<string, boolean>;
    }>;
    private log;
}
/**
 * Create a new Relay engine instance
 */
export declare function createRelayEngine(config?: RelayEngineConfig): RelayEngine;
export declare function getRelayEngine(): RelayEngine;
//# sourceMappingURL=engine.d.ts.map