import { ChannelType, } from '../types.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Vonage } = require('@vonage/server-sdk');
const { Auth } = require('@vonage/auth');
export class VonageAdapter {
    type = ChannelType.WHATSAPP;
    client;
    config;
    messageCallback;
    constructor(config) {
        this.config = config;
        // Initialize Vonage client
        if (config.applicationId && config.privateKey) {
            // Use Application auth (recommended for Messages API)
            this.client = new Vonage(new Auth({
                apiKey: config.apiKey,
                apiSecret: config.apiSecret,
                applicationId: config.applicationId,
                privateKey: config.privateKey,
            }));
        }
        else {
            // Use basic auth
            this.client = new Vonage(new Auth({
                apiKey: config.apiKey,
                apiSecret: config.apiSecret,
            }));
        }
    }
    async initialize() {
        console.log('📱 Initializing Vonage adapter...');
        console.log(`   WhatsApp Number: ${this.config.whatsappNumber}`);
        // Verify credentials by checking account balance
        try {
            const balance = await this.client.accounts.getBalance();
            console.log(`   Account Balance: €${balance.value}`);
            console.log('✅ Vonage adapter initialized');
        }
        catch (error) {
            throw new Error(`Vonage authentication failed: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Send a WhatsApp message via Vonage Messages API
     */
    async send(message) {
        try {
            let to = message.recipientPhone || message.recipientId;
            if (!to) {
                return { success: false, error: 'No recipient provided' };
            }
            // Clean phone number (remove non-numeric, no + prefix for Vonage)
            to = to.replace(/[^0-9]/g, '');
            // Determine channel based on metadata or default to WhatsApp
            const channel = message.metadata?.channel || 'whatsapp';
            if (channel === 'whatsapp') {
                // Send via WhatsApp
                const result = await this.client.messages.send({
                    message_type: 'text',
                    to: to,
                    from: this.config.whatsappNumber.replace(/[^0-9]/g, ''),
                    channel: 'whatsapp',
                    text: message.text,
                });
                return {
                    success: true,
                    messageId: result.message_uuid,
                };
            }
            else {
                // Send via SMS
                const result = await this.client.sms.send({
                    to: to,
                    from: this.config.whatsappNumber,
                    text: message.text,
                });
                return {
                    success: true,
                    messageId: result.messages?.[0]?.['message-id'],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message',
            };
        }
    }
    /**
     * Send with delay (Vonage doesn't have typing indicators for WhatsApp)
     */
    async sendWithTyping(message, delayMs = 1000) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.send(message);
    }
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Handle incoming webhook from Vonage
     * Call this from your Express route
     */
    async handleWebhook(payload) {
        try {
            // Vonage Messages API webhook format
            const { message_uuid, from, to, text, timestamp, channel, } = payload;
            // Skip if no text content
            if (!text && !payload.content?.text) {
                return { handled: true };
            }
            const messageText = text || payload.content?.text || '';
            const senderNumber = from?.number || from;
            const isWhatsApp = channel === 'whatsapp' || payload.channel === 'whatsapp';
            const message = {
                id: message_uuid || `vonage-${Date.now()}`,
                channelType: isWhatsApp ? ChannelType.WHATSAPP : ChannelType.IMESSAGE,
                senderId: senderNumber,
                senderPhone: senderNumber,
                text: messageText,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                metadata: {
                    to: to?.number || to,
                    channel: isWhatsApp ? 'whatsapp' : 'sms',
                    raw: payload,
                },
            };
            console.log(`\n📨 [${isWhatsApp ? 'WhatsApp' : 'SMS'}] From +${senderNumber}: "${messageText.substring(0, 50)}..."`);
            if (this.messageCallback) {
                await this.messageCallback(message);
            }
            return { handled: true };
        }
        catch (error) {
            return {
                handled: false,
                error: error instanceof Error ? error.message : 'Failed to process webhook',
            };
        }
    }
    async shutdown() {
        console.log('📱 Shutting down Vonage adapter...');
    }
    /**
     * Get account balance
     */
    async getBalance() {
        try {
            const result = await this.client.accounts.getBalance();
            return {
                balance: result.value,
                currency: 'EUR',
            };
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=vonage-adapter.js.map