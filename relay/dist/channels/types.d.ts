import { z } from 'zod';
/**
 * Channel types for Relay messaging
 */
export declare enum ChannelType {
    CLI = "cli",
    IMESSAGE = "imessage",
    WHATSAPP = "whatsapp",
    TELEGRAM = "telegram",
    WEB = "web"
}
/**
 * Incoming message from any channel
 */
export declare const ChannelMessageSchema: z.ZodObject<{
    id: z.ZodString;
    channelType: z.ZodEnum<typeof ChannelType>;
    senderId: z.ZodString;
    senderPhone: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ChannelMessage = z.infer<typeof ChannelMessageSchema>;
/**
 * Outgoing message to any channel
 */
export interface OutgoingMessage {
    recipientId: string;
    recipientPhone?: string;
    text: string;
    mediaUrl?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Channel adapter interface - all channels must implement this
 */
export interface ChannelAdapter {
    readonly type: ChannelType;
    /**
     * Initialize the channel (connect, authenticate, etc.)
     */
    initialize(): Promise<void>;
    /**
     * Send a message through the channel
     */
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Register a callback for incoming messages
     */
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Shut down the channel gracefully
     */
    shutdown(): Promise<void>;
}
/**
 * Channel configuration
 */
export interface ChannelConfig {
    enabled: boolean;
    webhookPath?: string;
    apiKey?: string;
    apiSecret?: string;
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map