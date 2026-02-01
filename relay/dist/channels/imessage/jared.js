import { ChannelType, } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const execAsync = promisify(exec);
export class JaredAdapter {
    type = ChannelType.IMESSAGE;
    config;
    messageCallback;
    pollTimer;
    lastMessageId = 0;
    chatDbPath;
    constructor(config = {}) {
        this.config = {
            pollInterval: config.pollInterval || 2000,
            ...config,
        };
        this.chatDbPath = config.chatDbPath ||
            path.join(process.env.HOME || '', 'Library/Messages/chat.db');
    }
    async initialize() {
        console.log('📱 Initializing native iMessage adapter...');
        // Check if we're on macOS
        if (process.platform !== 'darwin') {
            throw new Error('Native iMessage integration only works on macOS');
        }
        // Check if Messages database exists
        if (!fs.existsSync(this.chatDbPath)) {
            throw new Error(`Messages database not found at ${this.chatDbPath}. Make sure Messages.app is set up.`);
        }
        // Get the last message ID to avoid processing old messages
        try {
            this.lastMessageId = await this.getLastMessageId();
            console.log(`   Starting from message ID: ${this.lastMessageId}`);
        }
        catch (error) {
            console.warn('   Could not get last message ID, starting from 0');
            this.lastMessageId = 0;
        }
        // Start polling for new messages
        this.startPolling();
        console.log('✅ Native iMessage adapter initialized');
        console.log('   Monitoring for incoming messages...');
    }
    /**
     * Send an iMessage using AppleScript
     */
    async send(message) {
        try {
            const phone = message.recipientPhone || message.recipientId;
            if (!phone) {
                return { success: false, error: 'No recipient phone number provided' };
            }
            // Escape special characters for AppleScript
            const escapedText = message.text
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n');
            const script = `
        tell application "Messages"
          set targetService to 1st service whose service type = iMessage
          set targetBuddy to buddy "${phone}" of targetService
          send "${escapedText}" to targetBuddy
        end tell
      `;
            await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
            return {
                success: true,
                messageId: `local-${Date.now()}`,
            };
        }
        catch (error) {
            // Try alternative method using "send" directly to phone number
            try {
                const phone = message.recipientPhone || message.recipientId;
                const escapedText = message.text
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"');
                const altScript = `
          tell application "Messages"
            send "${escapedText}" to buddy "${phone}" of (service 1 whose service type is iMessage)
          end tell
        `;
                await execAsync(`osascript -e '${altScript.replace(/'/g, "'\\''")}'`);
                return {
                    success: true,
                    messageId: `local-${Date.now()}`,
                };
            }
            catch (altError) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to send iMessage',
                };
            }
        }
    }
    /**
     * Send with a typing delay for more natural feel
     */
    async sendWithTyping(message, delayMs = 1500) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.send(message);
    }
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Handle incoming webhook (not used for native integration)
     */
    async handleWebhook(_payload) {
        return { handled: false, error: 'Native adapter does not use webhooks' };
    }
    async shutdown() {
        console.log('📱 Shutting down native iMessage adapter...');
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
    }
    /**
     * Start polling the Messages database for new messages
     */
    startPolling() {
        this.pollTimer = setInterval(async () => {
            try {
                await this.checkNewMessages();
            }
            catch (error) {
                // Silently ignore polling errors to avoid spam
            }
        }, this.config.pollInterval);
    }
    /**
     * Get the last message ID from the database
     */
    async getLastMessageId() {
        const query = `SELECT MAX(ROWID) as max_id FROM message;`;
        const result = await this.queryDb(query);
        const match = result.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    /**
     * Check for new incoming messages
     */
    async checkNewMessages() {
        if (!this.messageCallback)
            return;
        const query = `
      SELECT
        m.ROWID as rowid,
        m.guid,
        m.text,
        m.handle_id,
        h.id as phone,
        m.date,
        m.is_from_me
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE m.ROWID > ${this.lastMessageId}
        AND m.is_from_me = 0
        AND m.text IS NOT NULL
        AND m.text != ''
      ORDER BY m.ROWID ASC
      LIMIT 10;
    `;
        try {
            const result = await this.queryDb(query);
            const messages = this.parseQueryResult(result);
            for (const msg of messages) {
                if (msg.rowid > this.lastMessageId) {
                    this.lastMessageId = msg.rowid;
                    const channelMessage = {
                        id: msg.guid,
                        channelType: ChannelType.IMESSAGE,
                        senderId: msg.phone,
                        senderPhone: msg.phone,
                        text: msg.text,
                        timestamp: this.convertAppleTime(msg.date),
                        metadata: {
                            rowid: msg.rowid,
                            handle_id: msg.handle_id,
                        },
                    };
                    console.log(`\n📨 New iMessage from ${msg.phone}: "${msg.text.substring(0, 50)}..."`);
                    try {
                        await this.messageCallback(channelMessage);
                    }
                    catch (error) {
                        console.error('Error processing message:', error);
                    }
                }
            }
        }
        catch (error) {
            // Database might be locked, that's okay
        }
    }
    /**
     * Query the Messages SQLite database
     */
    async queryDb(query) {
        const { stdout } = await execAsync(`sqlite3 "${this.chatDbPath}" "${query.replace(/"/g, '\\"')}"`, { timeout: 5000 });
        return stdout;
    }
    /**
     * Parse SQLite query results
     */
    parseQueryResult(result) {
        const messages = [];
        const lines = result.trim().split('\n').filter(Boolean);
        for (const line of lines) {
            const parts = line.split('|');
            if (parts.length >= 7) {
                messages.push({
                    rowid: parseInt(parts[0], 10),
                    guid: parts[1],
                    text: parts[2],
                    handle_id: parts[3],
                    phone: parts[4],
                    date: parseInt(parts[5], 10),
                    is_from_me: parseInt(parts[6], 10),
                });
            }
        }
        return messages;
    }
    /**
     * Convert Apple's timestamp (nanoseconds since 2001) to JavaScript Date
     */
    convertAppleTime(appleTime) {
        // Apple timestamps are nanoseconds since Jan 1, 2001
        // JavaScript timestamps are milliseconds since Jan 1, 1970
        const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();
        const jsTime = appleEpoch + (appleTime / 1000000);
        return new Date(jsTime);
    }
}
//# sourceMappingURL=jared.js.map