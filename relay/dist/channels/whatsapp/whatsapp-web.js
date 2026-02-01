import { ChannelType, } from '../types.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
export class WhatsAppWebAdapter {
    type = ChannelType.WHATSAPP;
    client;
    config;
    messageCallback;
    isReady = false;
    constructor(config = {}) {
        this.config = {
            sessionPath: './.wwebjs_auth',
            ...config,
        };
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: this.config.sessionPath,
            }),
            puppeteer: {
                headless: true,
                args: this.config.puppeteerArgs || [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            },
        });
    }
    async initialize() {
        console.log('📱 Initializing WhatsApp Web adapter...');
        return new Promise((resolve, reject) => {
            // QR Code event - display in terminal for scanning
            this.client.on('qr', (qr) => {
                console.log('\n📲 Scan this QR code with WhatsApp:\n');
                qrcode.generate(qr, { small: true });
                console.log('\nOpen WhatsApp → Settings → Linked Devices → Link a Device\n');
            });
            // Ready event
            this.client.on('ready', () => {
                console.log('✅ WhatsApp Web connected!');
                this.isReady = true;
                resolve();
            });
            // Authentication success
            this.client.on('authenticated', () => {
                console.log('   ✅ Authenticated successfully');
            });
            // Authentication failure
            this.client.on('auth_failure', (msg) => {
                console.error('❌ Authentication failed:', msg);
                reject(new Error(`WhatsApp auth failed: ${msg}`));
            });
            // Disconnected
            this.client.on('disconnected', (reason) => {
                console.log('⚠️ WhatsApp disconnected:', reason);
                this.isReady = false;
            });
            // Incoming messages
            this.client.on('message', async (message) => {
                // Skip messages from self or groups (for now)
                if (message.fromMe || message.isGroupMsg)
                    return;
                // Skip non-text messages
                if (message.type !== 'chat')
                    return;
                const channelMessage = {
                    id: message.id._serialized,
                    channelType: ChannelType.WHATSAPP,
                    senderId: message.from,
                    senderPhone: message.from.replace('@c.us', ''),
                    text: message.body,
                    timestamp: new Date(message.timestamp * 1000),
                    metadata: {
                        notifyName: message.notifyName,
                        isGroup: message.isGroupMsg,
                    },
                };
                console.log(`\n📨 WhatsApp from ${channelMessage.senderPhone}: "${message.body.substring(0, 50)}..."`);
                if (this.messageCallback) {
                    try {
                        await this.messageCallback(channelMessage);
                    }
                    catch (error) {
                        console.error('Error processing message:', error);
                    }
                }
            });
            // Initialize the client
            this.client.initialize().catch(reject);
        });
    }
    /**
     * Send a WhatsApp message
     */
    async send(message) {
        if (!this.isReady) {
            return { success: false, error: 'WhatsApp not connected' };
        }
        try {
            let recipient = message.recipientPhone || message.recipientId;
            if (!recipient) {
                return { success: false, error: 'No recipient provided' };
            }
            // Format phone number for WhatsApp
            // Remove any non-numeric characters and add @c.us suffix
            recipient = recipient.replace(/[^0-9]/g, '');
            if (!recipient.includes('@')) {
                recipient = `${recipient}@c.us`;
            }
            const result = await this.client.sendMessage(recipient, message.text);
            return {
                success: true,
                messageId: result.id._serialized,
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
     * Send with typing indicator
     */
    async sendWithTyping(message, delayMs = 2000) {
        if (!this.isReady) {
            return { success: false, error: 'WhatsApp not connected' };
        }
        try {
            let recipient = message.recipientPhone || message.recipientId;
            recipient = recipient?.replace(/[^0-9]/g, '');
            if (recipient && !recipient.includes('@')) {
                recipient = `${recipient}@c.us`;
            }
            if (recipient) {
                const chat = await this.client.getChatById(recipient);
                await chat.sendStateTyping();
            }
            // Wait for typing effect
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return this.send(message);
        }
        catch {
            // If typing indicator fails, just send the message
            return this.send(message);
        }
    }
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Handle webhook (not used for whatsapp-web.js)
     */
    async handleWebhook(_payload) {
        return { handled: false, error: 'WhatsApp Web adapter does not use webhooks' };
    }
    async shutdown() {
        console.log('📱 Shutting down WhatsApp Web adapter...');
        if (this.client) {
            await this.client.destroy();
        }
    }
    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isReady,
            info: this.isReady ? this.client.info : undefined,
        };
    }
    /**
     * Logout and clear session
     */
    async logout() {
        if (this.client) {
            await this.client.logout();
            this.isReady = false;
        }
    }
}
//# sourceMappingURL=whatsapp-web.js.map