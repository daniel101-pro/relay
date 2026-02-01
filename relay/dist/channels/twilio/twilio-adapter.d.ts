import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * Twilio Integration for WhatsApp Business + SMS
 *
 * Twilio provides a dedicated phone number that works with WhatsApp Business.
 * Your number shows as "Relay" (or your business name) on WhatsApp.
 *
 * Setup:
 * 1. Create account at https://twilio.com
 * 2. Get a phone number with WhatsApp capability
 * 3. Set up WhatsApp Sender in Twilio Console
 * 4. Configure webhook URL for incoming messages
 *
 * Features:
 * - Dedicated business phone number
 * - Shows your business name "Relay" on WhatsApp
 * - Works with WhatsApp + SMS on same number
 * - Professional business presence
 * - No personal phone needed
 */
interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    whatsappNumber?: string;
}
export declare class TwilioAdapter implements ChannelAdapter {
    readonly type = ChannelType.WHATSAPP;
    private client;
    private config;
    private messageCallback?;
    constructor(config: TwilioConfig);
    initialize(): Promise<void>;
    /**
     * Send a message via Twilio (WhatsApp or SMS)
     */
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send with a small delay (Twilio doesn't have typing indicators)
     */
    sendWithTyping(message: OutgoingMessage, delayMs?: number): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Handle incoming webhook from Twilio
     * Call this from your Express route
     */
    handleWebhook(payload: any): Promise<{
        handled: boolean;
        error?: string;
    }>;
    /**
     * Validate that a webhook request is from Twilio
     */
    validateWebhook(signature: string, url: string, params: any): boolean;
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
//# sourceMappingURL=twilio-adapter.d.ts.map