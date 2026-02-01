import 'dotenv/config';
import { createRelayEngine } from './core/engine.js';
import { WhatsAppWebAdapter } from './channels/whatsapp/whatsapp-web.js';
import { MessageSource } from './types/index.js';
/**
 * Relay WhatsApp Server
 *
 * Connects Relay to WhatsApp using whatsapp-web.js.
 * Free, no API keys needed - just scan a QR code!
 *
 * How it works:
 * 1. Run this script
 * 2. Scan the QR code with your phone's WhatsApp
 * 3. Anyone messaging your WhatsApp number talks to Relay
 *
 * Requirements:
 * - Node.js 18+
 * - A WhatsApp account
 * - Phone connected to internet (for WhatsApp Web protocol)
 */
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - WhatsApp Integration                         ║
║   Blockchain banking through WhatsApp                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not set in .env file');
        process.exit(1);
    }
    console.log('📱 Setting up WhatsApp integration...\n');
    console.log('   This may take a moment to start the browser...\n');
    // Create Relay engine
    const engine = createRelayEngine({ debug: true });
    // Create WhatsApp adapter
    const whatsapp = new WhatsAppWebAdapter({
        sessionPath: './.wwebjs_auth',
    });
    // Handle incoming messages
    whatsapp.onMessage(async (message) => {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📨 From: +${message.senderPhone}`);
        console.log(`💬 Message: ${message.text}`);
        console.log(`${'─'.repeat(50)}\n`);
        try {
            // Process with Relay
            console.log('⏳ Processing with Relay...\n');
            const response = await engine.chat(message.text, message.senderId, MessageSource.WHATSAPP);
            console.log('📤 Response:');
            console.log(response.message);
            console.log('');
            // Send response back with typing indicator
            const result = await whatsapp.sendWithTyping({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: response.message,
            });
            if (result.success) {
                console.log('✅ Reply sent successfully\n');
            }
            else {
                console.error('❌ Failed to send reply:', result.error);
            }
        }
        catch (error) {
            console.error('❌ Error:', error);
            // Send error message
            await whatsapp.send({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: "Sorry, I encountered an error processing your message. Please try again.",
            });
        }
    });
    // Initialize
    try {
        await whatsapp.initialize();
    }
    catch (error) {
        console.error('❌ Failed to initialize:', error instanceof Error ? error.message : error);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure you have Chrome/Chromium installed');
        console.log('   2. Try deleting .wwebjs_auth folder and re-scanning QR');
        console.log('   3. Check your internet connection');
        process.exit(1);
    }
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        await whatsapp.shutdown();
        process.exit(0);
    });
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ Relay is now connected to WhatsApp!                  ║
║                                                           ║
║   • Message your WhatsApp number to interact              ║
║   • Session is saved - no need to scan QR again           ║
║   • Press Ctrl+C to stop                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=whatsapp-server.js.map