import { z } from 'zod';
import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * Sendblue API integration for iMessage
 *
 * Sendblue provides a REST API to send/receive iMessages.
 * Sign up at https://sendblue.co to get API credentials.
 *
 * Features:
 * - Send iMessages to any iPhone user
 * - Receive messages via webhook
 * - Support for media (images, etc.)
 * - Message status tracking
 */
export declare const SendblueWebhookSchema: z.ZodObject<{
    accountEmail: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    media_url: z.ZodOptional<z.ZodString>;
    is_outbound: z.ZodBoolean;
    status: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    error_message: z.ZodOptional<z.ZodString>;
    message_handle: z.ZodString;
    date_sent: z.ZodString;
    date_updated: z.ZodString;
    from_number: z.ZodString;
    number: z.ZodString;
    to_number: z.ZodString;
    was_downgraded: z.ZodOptional<z.ZodBoolean>;
    message_type: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SendblueWebhook = z.infer<typeof SendblueWebhookSchema>;
interface SendblueConfig {
    apiKey: string;
    apiSecret: string;
    callbackUrl?: string;
}
export declare class SendblueAdapter implements ChannelAdapter {
    readonly type = ChannelType.IMESSAGE;
    private config;
    private messageCallback?;
    private baseUrl;
    constructor(config: SendblueConfig);
    initialize(): Promise<void>;
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send a message with typing indicator effect
     * Adds a small delay to simulate human-like response
     */
    sendWithTyping(message: OutgoingMessage, delayMs?: number): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Handle incoming webhook from Sendblue
     * Call this from your Express route handler
     */
    handleWebhook(payload: unknown): Promise<{
        handled: boolean;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    /**
     * Get message status
     */
    getMessageStatus(messageHandle: string): Promise<{
        status?: string;
        error?: string;
    }>;
    /**
     * Check if a phone number can receive iMessages
     */
    isIMessageEnabled(phoneNumber: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=sendblue.d.ts.map