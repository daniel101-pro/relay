import { ChannelAdapter, ChannelType, ChannelMessage, OutgoingMessage } from '../types.js';
/**
 * Jared-style iMessage integration using macOS Messages app directly
 *
 * This adapter uses AppleScript to send/receive iMessages through
 * the native Messages.app on macOS. No third-party service needed!
 *
 * Requirements:
 * - macOS with Messages.app signed into iMessage
 * - Full Disk Access permission for Terminal/Node
 * - Automation permission for Messages.app
 *
 * How it works:
 * - Sends messages via AppleScript to Messages.app
 * - Monitors ~/Library/Messages/chat.db for incoming messages
 * - Processes new messages and triggers callbacks
 */
interface JaredConfig {
    pollInterval?: number;
    chatDbPath?: string;
}
export declare class JaredAdapter implements ChannelAdapter {
    readonly type = ChannelType.IMESSAGE;
    private config;
    private messageCallback?;
    private pollTimer?;
    private lastMessageId;
    private chatDbPath;
    constructor(config?: JaredConfig);
    initialize(): Promise<void>;
    /**
     * Send an iMessage using AppleScript
     */
    send(message: OutgoingMessage): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send with a typing delay for more natural feel
     */
    sendWithTyping(message: OutgoingMessage, delayMs?: number): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    onMessage(callback: (message: ChannelMessage) => Promise<void>): void;
    /**
     * Handle incoming webhook (not used for native integration)
     */
    handleWebhook(_payload: unknown): Promise<{
        handled: boolean;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    /**
     * Start polling the Messages database for new messages
     */
    private startPolling;
    /**
     * Get the last message ID from the database
     */
    private getLastMessageId;
    /**
     * Check for new incoming messages
     */
    private checkNewMessages;
    /**
     * Query the Messages SQLite database
     */
    private queryDb;
    /**
     * Parse SQLite query results
     */
    private parseQueryResult;
    /**
     * Convert Apple's timestamp (nanoseconds since 2001) to JavaScript Date
     */
    private convertAppleTime;
}
export {};
//# sourceMappingURL=jared.d.ts.map