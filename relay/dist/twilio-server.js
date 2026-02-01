import 'dotenv/config';
import express from 'express';
import { createRelayEngine } from './core/engine.js';
import { TwilioAdapter } from './channels/twilio/twilio-adapter.js';
import { MessageSource } from './types/index.js';
/**
 * Relay Twilio Server
 *
 * A dedicated phone number for Relay that works with WhatsApp + SMS.
 * Shows as "Relay" (your business name) on WhatsApp!
 *
 * Setup:
 * 1. Create Twilio account: https://twilio.com
 * 2. Buy a phone number with WhatsApp capability
 * 3. Enable WhatsApp Sandbox or apply for WhatsApp Business API
 * 4. Set webhook URL to: https://your-domain.com/webhook/twilio
 * 5. Add credentials to .env:
 *    TWILIO_ACCOUNT_SID=ACxxxxx
 *    TWILIO_AUTH_TOKEN=xxxxx
 *    TWILIO_PHONE_NUMBER=+14155551234
 */
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - Twilio WhatsApp Business                     ║
║   Dedicated number for WhatsApp + SMS                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check required environment variables
    const required = ['OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   • ${key}`));
        console.error('\nAdd these to your .env file');
        console.error('\nGet Twilio credentials from: https://console.twilio.com');
        process.exit(1);
    }
    // Create Relay engine
    const engine = createRelayEngine({ debug: true });
    // Create Twilio adapter
    const twilio = new TwilioAdapter({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    });
    // Initialize Twilio
    try {
        await twilio.initialize();
    }
    catch (error) {
        console.error('❌ Failed to initialize Twilio:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    // Handle incoming messages
    twilio.onMessage(async (message) => {
        const isWhatsApp = message.metadata?.channel === 'whatsapp';
        const platform = isWhatsApp ? 'WhatsApp' : 'SMS';
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📨 [${platform}] From: +${message.senderPhone}`);
        console.log(`💬 Message: ${message.text}`);
        console.log(`${'─'.repeat(50)}\n`);
        try {
            // Process with Relay
            console.log('⏳ Processing with Relay...\n');
            const response = await engine.chat(message.text, message.senderId, isWhatsApp ? MessageSource.WHATSAPP : MessageSource.CLI);
            console.log('📤 Response:');
            console.log(response.message);
            console.log('');
            // Send response back
            const result = await twilio.sendWithTyping({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: response.message,
                metadata: message.metadata,
            });
            if (result.success) {
                console.log(`✅ [${platform}] Reply sent (${result.messageId})\n`);
            }
            else {
                console.error(`❌ [${platform}] Failed to send:`, result.error);
            }
        }
        catch (error) {
            console.error('❌ Error:', error);
            // Send error message
            await twilio.send({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: "Sorry, I encountered an error. Please try again.",
                metadata: message.metadata,
            });
        }
    });
    // ═══════════════════════════════════════════════════════════
    // Express Routes
    // ═══════════════════════════════════════════════════════════
    // Health check
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            phone: process.env.TWILIO_PHONE_NUMBER,
        });
    });
    // Twilio webhook for incoming messages
    app.post('/webhook/twilio', async (req, res) => {
        console.log('📥 Received Twilio webhook');
        try {
            const result = await twilio.handleWebhook(req.body);
            if (!result.handled) {
                console.warn('⚠️ Webhook not handled:', result.error);
            }
            // Twilio expects a TwiML response (can be empty)
            res.set('Content-Type', 'text/xml');
            res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        }
        catch (error) {
            console.error('❌ Webhook error:', error);
            res.status(500).send('Error');
        }
    });
    // WhatsApp status callback (optional)
    app.post('/webhook/twilio/status', (req, res) => {
        const { MessageSid, MessageStatus, To } = req.body;
        console.log(`📊 Message ${MessageSid} to ${To}: ${MessageStatus}`);
        res.sendStatus(200);
    });
    // Start server
    const port = parseInt(process.env.PORT || '3001', 10);
    app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ RELAY TWILIO SERVER RUNNING                          ║
║                                                           ║
║   Phone: ${process.env.TWILIO_PHONE_NUMBER?.padEnd(43)}║
║   Port:  ${String(port).padEnd(43)}║
║                                                           ║
║   Webhook URL: https://your-domain.com/webhook/twilio     ║
║   (Set this in Twilio Console)                            ║
║                                                           ║
║   For local testing, use ngrok:                           ║
║   ngrok http ${port}                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    });
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        await twilio.shutdown();
        process.exit(0);
    });
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=twilio-server.js.map