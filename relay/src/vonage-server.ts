import 'dotenv/config';
import express from 'express';
import { createRelayEngine } from './core/engine.js';
import { VonageAdapter } from './channels/vonage/vonage-adapter.js';
import { MessageSource } from './types/index.js';

/**
 * Relay Vonage Server
 *
 * A dedicated phone number for Relay using Vonage (formerly Nexmo).
 * Shows as "Relay" (your business name) on WhatsApp!
 *
 * Setup:
 * 1. Create Vonage account: https://dashboard.nexmo.com
 * 2. Get API Key and Secret from Settings
 * 3. Set up WhatsApp in Messages API Sandbox (for testing) or apply for production
 * 4. Set webhook URL to: https://your-domain.com/webhook/vonage
 * 5. Add credentials to .env:
 *    VONAGE_API_KEY=xxxxx
 *    VONAGE_API_SECRET=xxxxx
 *    VONAGE_WHATSAPP_NUMBER=+14155551234
 */

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - Vonage WhatsApp Business                     ║
║   Dedicated number for WhatsApp + SMS                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Check required environment variables
  const required = ['OPENAI_API_KEY', 'VONAGE_API_KEY', 'VONAGE_API_SECRET', 'VONAGE_WHATSAPP_NUMBER'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   • ${key}`));
    console.error('\nAdd these to your .env file');
    console.error('\nGet Vonage credentials from: https://dashboard.nexmo.com/settings');
    process.exit(1);
  }

  // Create Relay engine
  const engine = createRelayEngine({ debug: true });

  // Create Vonage adapter
  const vonage = new VonageAdapter({
    apiKey: process.env.VONAGE_API_KEY!,
    apiSecret: process.env.VONAGE_API_SECRET!,
    whatsappNumber: process.env.VONAGE_WHATSAPP_NUMBER!,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY,
  });

  // Initialize Vonage
  try {
    await vonage.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize Vonage:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Handle incoming messages
  vonage.onMessage(async (message) => {
    const isWhatsApp = message.metadata?.channel === 'whatsapp';
    const platform = isWhatsApp ? 'WhatsApp' : 'SMS';

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📨 [${platform}] From: +${message.senderPhone}`);
    console.log(`💬 Message: ${message.text}`);
    console.log(`${'─'.repeat(50)}\n`);

    try {
      // Process with Relay
      console.log('⏳ Processing with Relay...\n');
      const response = await engine.chat(
        message.text,
        message.senderId,
        isWhatsApp ? MessageSource.WHATSAPP : MessageSource.CLI
      );

      console.log('📤 Response:');
      console.log(response.message);
      console.log('');

      // Send response back
      const result = await vonage.sendWithTyping({
        recipientId: message.senderId,
        recipientPhone: message.senderPhone,
        text: response.message,
        metadata: message.metadata,
      });

      if (result.success) {
        console.log(`✅ [${platform}] Reply sent (${result.messageId})\n`);
      } else {
        console.error(`❌ [${platform}] Failed to send:`, result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error);

      // Send error message
      await vonage.send({
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
  app.get('/health', async (_req, res) => {
    const balance = await vonage.getBalance();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      phone: process.env.VONAGE_WHATSAPP_NUMBER,
      balance: balance,
    });
  });

  // Vonage webhook for incoming messages (Messages API)
  app.post('/webhook/vonage', async (req, res) => {
    console.log('📥 Received Vonage webhook');

    try {
      const result = await vonage.handleWebhook(req.body);

      if (!result.handled) {
        console.warn('⚠️ Webhook not handled:', result.error);
      }

      // Vonage expects 200 OK
      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Vonage inbound SMS webhook (for SMS API)
  app.post('/webhook/vonage/sms', async (req, res) => {
    console.log('📥 Received Vonage SMS webhook');

    try {
      // Convert SMS format to standard format
      const payload = {
        message_uuid: req.body.messageId,
        from: req.body.msisdn,
        to: req.body.to,
        text: req.body.text,
        channel: 'sms',
      };

      const result = await vonage.handleWebhook(payload);

      if (!result.handled) {
        console.warn('⚠️ Webhook not handled:', result.error);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Status webhook (delivery receipts)
  app.post('/webhook/vonage/status', (req, res) => {
    const { message_uuid, status, to } = req.body;
    console.log(`📊 Message ${message_uuid} to ${to}: ${status}`);
    res.status(200).send('OK');
  });

  // Start server
  const port = parseInt(process.env.PORT || '3001', 10);
  app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ RELAY VONAGE SERVER RUNNING                          ║
║                                                           ║
║   WhatsApp: ${process.env.VONAGE_WHATSAPP_NUMBER?.padEnd(41)}║
║   Port:     ${String(port).padEnd(41)}║
║                                                           ║
║   Webhooks:                                               ║
║   • Messages: https://your-domain.com/webhook/vonage      ║
║   • Status:   https://your-domain.com/webhook/vonage/status║
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
    await vonage.shutdown();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
