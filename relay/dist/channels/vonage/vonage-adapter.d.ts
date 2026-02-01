import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * Vonage Integration for WhatsApp Business + SMS
 *
 * Vonage (formerly Nexmo) provides a dedicated phone number for WhatsApp Business.
 * Your number shows as "Relay" (or your business name) on WhatsApp.
 *
 * Setup:
 * 1. Create account at https://dashboard.nexmo.com
 * 2. Get API Key and Secret from dashboard
 * 3. Set up WhatsApp Business in the Messages API Sandbox or production
 * 4. Configure webhook URL for incoming messages
 *
 * Features:
 * - Dedicated business phone number
 * - Shows your business name "Relay" on WhatsApp
 * - Works with WhatsApp + SMS on same number
 * - Professional business presence
 */
interface VonageConfig {
    apiKey: string;
    apiSecret: string;
    applicationId?: string;
    privateKey?: string;
    whatsappNumber: string;
}
export declare class VonageAdapter implements ChannelAdapter {
    readonly type = ChannelType.WHATSAPP;
    private client;
    private config;
    private messageCallback?;
    constructor(config: VonageConfig);
    initialize(): Promise<void>;
    /**
     * Send a WhatsApp message via Vonage Messages API
     */
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send with delay (Vonage doesn't have typing indicators for WhatsApp)
     */
    sendWithTyping(message: OutgoingMessage, delayMs?: number): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Handle incoming webhook from Vonage
     * Call this from your Express route
     */
    handleWebhook(payload: any): Promise<{
        handled: boolean;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    /**
     * Get account balance
     */
    getBalance(): Promise<{
        balance: string;
        currency: string;
    } | null>;
}
export {};
//# sourceMappingURL=vonage-adapter.d.ts.map