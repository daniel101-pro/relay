import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * BlueBubbles iMessage Integration
 *
 * BlueBubbles is a free, open-source iMessage bridge that runs on your Mac.
 * It provides a REST API and WebSocket for real-time messaging.
 *
 * Setup:
 * 1. Download BlueBubbles Server from https://bluebubbles.app
 * 2. Install and run on a Mac with iMessage signed in
 * 3. Get your server URL and password from the app
 * 4. Optionally set up ngrok for remote access
 *
 * Features:
 * - Free and open source
 * - REST API for sending messages
 * - WebSocket for real-time incoming messages
 * - Supports attachments, reactions, typing indicators
 * - Works with group chats
 */
interface BlueBubblesConfig {
    serverUrl: string;
    password: string;
    pollInterval?: number;
}
interface BBMessage {
    guid: string;
    text: string;
    handle?: {
        address: string;
    };
    isFromMe: boolean;
    dateCreated: number;
    chats?: Array<{
        guid: string;
    }>;
}
export declare class BlueBubblesAdapter implements ChannelAdapter {
    readonly type = ChannelType.IMESSAGE;
    private config;
    private messageCallback?;
    private ws?;
    private lastMessageDate;
    private pollTimer?;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: BlueBubblesConfig);
    initialize(): Promise<void>;
    /**
     * Ping the server to check connection
     */
    private ping;
    /**
     * Get auth headers
     */
    private getHeaders;
    /**
     * Send an iMessage
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
     * Handle webhook (for external webhook setup)
     */
    handleWebhook(payload: unknown): Promise<{
        handled: boolean;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    /**
     * Connect to WebSocket for real-time messages
     */
    private connectWebSocket;
    /**
     * Handle WebSocket messages
     */
    private handleWebSocketMessage;
    /**
     * Handle WebSocket close
     */
    private handleWebSocketClose;
    /**
     * Start polling for new messages (fallback)
     */
    private startPolling;
    /**
     * Poll for new messages
     */
    private pollMessages;
    /**
     * Get chat history
     */
    getChatHistory(phone: string, limit?: number): Promise<BBMessage[]>;
    /**
     * Send a reaction to a message
     */
    sendReaction(messageGuid: string, reaction: 'love' | 'like' | 'dislike' | 'laugh' | 'emphasize' | 'question'): Promise<boolean>;
}
export {};
//# sourceMappingURL=bluebubbles.d.ts.map