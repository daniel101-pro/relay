import { IntentClassifier, getIntentClassifier } from './intent-classifier.js';
import { SkillRouter, getSkillRouter } from './skill-router.js';
import { ResponseGenerator, getResponseGenerator } from './response-generator.js';
import {
  IncomingMessage,
  RelayResponse,
  IntentContext,
  createErrorResponse,
  IntentType,
  createMessage,
  MessageSource,
} from '../types/index.js';

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
export class RelayEngine {
  private classifier: IntentClassifier;
  private router: SkillRouter;
  private responseGenerator: ResponseGenerator;
  private config: RelayEngineConfig;

  constructor(config: RelayEngineConfig = {}) {
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
  async process(message: IncomingMessage): Promise<RelayResponse> {
    const startTime = Date.now();

    try {
      this.log('Processing message:', message.text);

      // Step 1: Classify intent
      this.log('Classifying intent...');
      const intent = await this.classifier.classify(message.text);
      this.log('Intent classified:', intent.type, 'confidence:', intent.confidence);

      // Step 2: Create context
      const context: IntentContext = {
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
      const response = await this.responseGenerator.generate(
        result,
        intent.type,
        message.text
      );

      // Add total processing time
      response.processingTime = Date.now() - startTime;
      this.log('Total processing time:', response.processingTime, 'ms');

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Relay engine error:', errorMessage);

      return createErrorResponse(errorMessage, IntentType.UNKNOWN);
    }
  }

  /**
   * Simple text input processing (convenience method)
   */
  async chat(
    text: string,
    userId: string = 'anonymous',
    source: MessageSource = MessageSource.CLI
  ): Promise<RelayResponse> {
    const message = createMessage(text, userId, source);
    return this.process(message);
  }

  /**
   * Get available capabilities
   */
  getCapabilities(): Array<{ name: string; description: string; intents: string[] }> {
    return this.router.getSkillInfo();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; components: Record<string, boolean> }> {
    const components = {
      classifier: true,
      router: true,
      responseGenerator: true,
    };

    try {
      // Test classifier with a simple message
      await this.classifier.classify('test');
    } catch {
      components.classifier = false;
    }

    const allHealthy = Object.values(components).every(Boolean);

    return {
      status: allHealthy ? 'ok' : 'error',
      components,
    };
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Relay]', ...args);
    }
  }
}

/**
 * Create a new Relay engine instance
 */
export function createRelayEngine(config?: RelayEngineConfig): RelayEngine {
  return new RelayEngine(config);
}

// Default singleton
let defaultEngine: RelayEngine | null = null;

export function getRelayEngine(): RelayEngine {
  if (!defaultEngine) {
    defaultEngine = new RelayEngine();
  }
  return defaultEngine;
}
