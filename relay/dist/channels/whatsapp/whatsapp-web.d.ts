import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * WhatsApp Web Integration using whatsapp-web.js
 *
 * This adapter connects to WhatsApp via the WhatsApp Web protocol.
 * It's free and doesn't require any API keys - just scan a QR code!
 *
 * Features:
 * - Free, no API keys needed
 * - Scan QR code to authenticate
 * - Session persistence (stay logged in)
 * - Supports text messages
 * - Real-time message receiving
 *
 * Note: This uses WhatsApp Web protocol, which means your phone
 * needs to stay connected to the internet.
 */
interface WhatsAppWebConfig {
    sessionPath?: string;
    puppeteerArgs?: string[];
}
export declare class WhatsAppWebAdapter implements ChannelAdapter {
    readonly type = ChannelType.WHATSAPP;
    private client;
    private config;
    private messageCallback?;
    private isReady;
    constructor(config?: WhatsAppWebConfig);
    initialize(): Promise<void>;
    /**
     * Send a WhatsApp message
     */
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send with typing indicator
     */
    sendWithTyping(message: OutgoingMessage, delayMs?: number): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Handle webhook (not used for whatsapp-web.js)
     */
    handleWebhook(_payload: unknown): Promise<{
        handled: boolean;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        info?: any;
    };
    /**
     * Logout and clear session
     */
    logout(): Promise<void>;
}
export {};
//# sourceMappingURL=whatsapp-web.d.ts.map