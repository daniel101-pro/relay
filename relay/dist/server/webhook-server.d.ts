import { RelayEngine } from '../core/engine.js';
/**
 * Webhook server for handling incoming messages from various channels
 */
interface WebhookServerConfig {
    port: number;
    webhookSecret?: string;
    sendblue?: {
        apiKey: string;
        apiSecret: string;
        callbackUrl?: string;
    };
}
export declare class WebhookServer {
    private app;
    private engine;
    private config;
    private imessageAdapter?;
    private server?;
    constructor(engine: RelayEngine, config: WebhookServerConfig);
    private setupMiddleware;
    private setupRoutes;
    /**
     * Handle incoming message from any channel
     */
    private handleIncomingMessage;
    private channelToSource;
    /**
     * Initialize all configured channels
     */
    initializeChannels(): Promise<void>;
    /**
     * Start the webhook server
     */
    start(): Promise<void>;
    /**
     * Stop the server gracefully
     */
    stop(): Promise<void>;
}
/**
 * Create and start a webhook server
 */
export declare function createWebhookServer(engine: RelayEngine, config: WebhookServerConfig): WebhookServer;
export {};
//# sourceMappingURL=webhook-server.d.ts.map