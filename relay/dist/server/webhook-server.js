import express from 'express';
import { SendblueAdapter } from '../channels/imessage/sendblue.js';
import { ChannelType } from '../channels/types.js';
import { MessageSource } from '../types/index.js';
export class WebhookServer {
    app;
    engine;
    config;
    imessageAdapter;
    server;
    constructor(engine, config) {
        this.engine = engine;
        this.config = config;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json());
        // Request logging
        this.app.use((req, _res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        // Webhook signature verification (optional)
        if (this.config.webhookSecret) {
            this.app.use('/webhook', (req, res, next) => {
                const signature = req.headers['x-webhook-signature'];
                if (signature !== this.config.webhookSecret) {
                    console.warn('⚠️ Invalid webhook signature');
                    res.status(401).json({ error: 'Invalid signature' });
                    return;
                }
                next();
            });
        }
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                channels: {
                    imessage: !!this.imessageAdapter,
                },
            });
        });
        // iMessage webhook (Sendblue)
        this.app.post('/webhook/imessage', async (req, res) => {
            try {
                if (!this.imessageAdapter) {
                    res.status(503).json({ error: 'iMessage not configured' });
                    return;
                }
                console.log('📥 Received iMessage webhook:', JSON.stringify(req.body, null, 2));
                const result = await this.imessageAdapter.handleWebhook(req.body);
                if (!result.handled) {
                    console.warn('⚠️ Webhook not handled:', result.error);
                }
                // Always return 200 to acknowledge receipt
                res.json({ received: true });
            }
            catch (error) {
                console.error('❌ Webhook error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Generic message endpoint (for testing)
        this.app.post('/api/message', async (req, res) => {
            try {
                const { text, userId, channel } = req.body;
                if (!text) {
                    res.status(400).json({ error: 'Missing text field' });
                    return;
                }
                const response = await this.engine.chat(text, userId || 'api-user', MessageSource.CLI);
                res.json(response);
            }
            catch (error) {
                console.error('❌ API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // 404 handler
        this.app.use((_req, res) => {
            res.status(404).json({ error: 'Not found' });
        });
    }
    /**
     * Handle incoming message from any channel
     */
    async handleIncomingMessage(message) {
        console.log(`\n📨 Incoming message from ${message.channelType}:`);
        console.log(`   From: ${message.senderId}`);
        console.log(`   Text: ${message.text}`);
        try {
            // Process with Relay engine
            const response = await this.engine.chat(message.text, message.senderId, this.channelToSource(message.channelType));
            console.log(`\n📤 Relay response:`);
            console.log(`   ${response.message.substring(0, 100)}...`);
            // Send response back through the appropriate channel
            if (message.channelType === ChannelType.IMESSAGE && this.imessageAdapter) {
                const sendResult = await this.imessageAdapter.sendWithTyping({
                    recipientId: message.senderId,
                    recipientPhone: message.senderPhone,
                    text: response.message,
                });
                if (!sendResult.success) {
                    console.error('❌ Failed to send iMessage:', sendResult.error);
                }
                else {
                    console.log('✅ iMessage sent:', sendResult.messageId);
                }
            }
        }
        catch (error) {
            console.error('❌ Error processing message:', error);
            // Send error message back to user
            if (message.channelType === ChannelType.IMESSAGE && this.imessageAdapter) {
                await this.imessageAdapter.send({
                    recipientId: message.senderId,
                    recipientPhone: message.senderPhone,
                    text: "Sorry, I encountered an error processing your message. Please try again.",
                });
            }
        }
    }
    channelToSource(channel) {
        switch (channel) {
            case ChannelType.IMESSAGE:
                return MessageSource.IMESSAGE;
            case ChannelType.WHATSAPP:
                return MessageSource.WHATSAPP;
            default:
                return MessageSource.CLI;
        }
    }
    /**
     * Initialize all configured channels
     */
    async initializeChannels() {
        // Initialize iMessage (Sendblue)
        if (this.config.sendblue) {
            console.log('\n📱 Setting up iMessage channel...');
            this.imessageAdapter = new SendblueAdapter({
                apiKey: this.config.sendblue.apiKey,
                apiSecret: this.config.sendblue.apiSecret,
                callbackUrl: this.config.sendblue.callbackUrl,
            });
            await this.imessageAdapter.initialize();
            // Register message handler
            this.imessageAdapter.onMessage(async (message) => {
                await this.handleIncomingMessage(message);
            });
            console.log('✅ iMessage channel ready');
        }
    }
    /**
     * Start the webhook server
     */
    async start() {
        await this.initializeChannels();
        this.server = this.app.listen(this.config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY WEBHOOK SERVER                                 ║
║                                                           ║
║   Server running on port ${this.config.port}                         ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /health           - Health check                 ║
║   • POST /webhook/imessage - iMessage webhooks            ║
║   • POST /api/message      - Direct API                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
        });
    }
    /**
     * Stop the server gracefully
     */
    async stop() {
        console.log('\n🛑 Shutting down webhook server...');
        if (this.imessageAdapter) {
            await this.imessageAdapter.shutdown();
        }
        if (this.server) {
            this.server.close();
        }
        console.log('👋 Server stopped');
    }
}
/**
 * Create and start a webhook server
 */
export function createWebhookServer(engine, config) {
    return new WebhookServer(engine, config);
}
//# sourceMappingURL=webhook-server.js.map