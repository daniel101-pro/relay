import { ChannelType, } from '../types.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const twilio = require('twilio');
export class TwilioAdapter {
    type = ChannelType.WHATSAPP;
    client;
    config;
    messageCallback;
    constructor(config) {
        this.config = config;
        this.client = twilio(config.accountSid, config.authToken);
    }
    async initialize() {
        console.log('📱 Initializing Twilio adapter...');
        console.log(`   Phone: ${this.config.phoneNumber}`);
        // Verify credentials by fetching account info
        try {
            const account = await this.client.api.accounts(this.config.accountSid).fetch();
            console.log(`   Account: ${account.friendlyName}`);
            console.log('✅ Twilio adapter initialized');
        }
        catch (error) {
            throw new Error(`Twilio authentication failed: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Send a message via Twilio (WhatsApp or SMS)
     */
    async send(message) {
        try {
            let to = message.recipientPhone || message.recipientId;
            if (!to) {
                return { success: false, error: 'No recipient provided' };
            }
            // Determine if WhatsApp or SMS based on the incoming format
            const isWhatsApp = to.startsWith('whatsapp:');
            // Format the 'to' number
            if (!to.startsWith('whatsapp:') && !to.startsWith('+')) {
                // If it came from WhatsApp, send back via WhatsApp
                if (message.metadata?.channel === 'whatsapp') {
                    to = `whatsapp:+${to.replace(/[^0-9]/g, '')}`;
                }
                else {
                    to = `+${to.replace(/[^0-9]/g, '')}`;
                }
            }
            // Determine 'from' number
            const from = isWhatsApp || message.metadata?.channel === 'whatsapp'
                ? (this.config.whatsappNumber || `whatsapp:${this.config.phoneNumber}`)
                : this.config.phoneNumber;
            const result = await this.client.messages.create({
                body: message.text,
                from: from,
                to: to,
            });
            return {
                success: true,
                messageId: result.sid,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message',
            };
        }
    }
    /**
     * Send with a small delay (Twilio doesn't have typing indicators)
     */
    async sendWithTyping(message, delayMs = 1000) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.send(message);
    }
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Handle incoming webhook from Twilio
     * Call this from your Express route
     */
    async handleWebhook(payload) {
        try {
            // Twilio webhook payload fields
            const { MessageSid, From, To, Body, NumMedia, } = payload;
            if (!Body || !From) {
                return { handled: true }; // Empty message, acknowledge but skip
            }
            // Determine channel type
            const isWhatsApp = From.startsWith('whatsapp:');
            const channelType = isWhatsApp ? ChannelType.WHATSAPP : ChannelType.IMESSAGE; // Using IMESSAGE for SMS
            // Clean phone number
            const phone = From.replace('whatsapp:', '').replace('+', '');
            const message = {
                id: MessageSid,
                channelType: channelType,
                senderId: From,
                senderPhone: phone,
                text: Body,
                timestamp: new Date(),
                metadata: {
                    to: To,
                    numMedia: NumMedia,
                    channel: isWhatsApp ? 'whatsapp' : 'sms',
                },
            };
            console.log(`\n📨 [${isWhatsApp ? 'WhatsApp' : 'SMS'}] From +${phone}: "${Body.substring(0, 50)}..."`);
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
    /**
     * Validate that a webhook request is from Twilio
     */
    validateWebhook(signature, url, params) {
        return twilio.validateRequest(this.config.authToken, signature, url, params);
    }
    async shutdown() {
        console.log('📱 Shutting down Twilio adapter...');
    }
    /**
     * Get account balance
     */
    async getBalance() {
        try {
            const balance = await this.client.api.accounts(this.config.accountSid).balance.fetch();
            return {
                balance: balance.balance,
                currency: balance.currency,
            };
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=twilio-adapter.js.map