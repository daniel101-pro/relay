import 'dotenv/config';
import { createRelayEngine } from './core/engine.js';
import { BlueBubblesAdapter } from './channels/imessage/bluebubbles.js';
import { MessageSource } from './types/index.js';
/**
 * Relay BlueBubbles iMessage Server
 *
 * Connects Relay to iMessage via BlueBubbles - a free, open-source
 * iMessage bridge that runs on your Mac.
 *
 * Setup:
 * 1. Download BlueBubbles Server from https://bluebubbles.app
 * 2. Install and run on a Mac with iMessage signed in
 * 3. Get your server URL and password from the BlueBubbles app
 * 4. Add to your .env file:
 *    BLUEBUBBLES_URL=http://localhost:1234
 *    BLUEBUBBLES_PASSWORD=your-password
 *
 * For remote access:
 * - Use the built-in Ngrok integration in BlueBubbles
 * - Or set up your own tunnel
 */
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - BlueBubbles iMessage                         ║
║   Free, open-source iMessage integration                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check required environment variables
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not set in .env file');
        process.exit(1);
    }
    if (!process.env.BLUEBUBBLES_URL || !process.env.BLUEBUBBLES_PASSWORD) {
        console.error('❌ BlueBubbles configuration missing');
        console.error('');
        console.error('Add to your .env file:');
        console.error('  BLUEBUBBLES_URL=http://localhost:1234');
        console.error('  BLUEBUBBLES_PASSWORD=your-password');
        console.error('');
        console.error('Get these values from the BlueBubbles Server app');
        process.exit(1);
    }
    console.log('📱 Setting up BlueBubbles integration...\n');
    // Create Relay engine
    const engine = createRelayEngine({ debug: true });
    // Create BlueBubbles adapter
    const imessage = new BlueBubblesAdapter({
        serverUrl: process.env.BLUEBUBBLES_URL,
        password: process.env.BLUEBUBBLES_PASSWORD,
    });
    // Handle incoming messages
    imessage.onMessage(async (message) => {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📨 From: ${message.senderPhone}`);
        console.log(`💬 Message: ${message.text}`);
        console.log(`${'─'.repeat(50)}\n`);
        try {
            // Process with Relay
            console.log('⏳ Processing with Relay...\n');
            const response = await engine.chat(message.text, message.senderId, MessageSource.IMESSAGE);
            console.log('📤 Response:');
            console.log(response.message);
            console.log('');
            // Send response back
            const result = await imessage.sendWithTyping({
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
            await imessage.send({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: "Sorry, I encountered an error. Please try again.",
            });
        }
    });
    // Initialize
    try {
        await imessage.initialize();
    }
    catch (error) {
        console.error('❌ Failed to initialize:', error instanceof Error ? error.message : error);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure BlueBubbles Server is running on your Mac');
        console.log('   2. Check the server URL and password are correct');
        console.log('   3. Ensure your Mac has iMessage signed in');
        console.log('   4. Try opening the BlueBubbles URL in a browser');
        process.exit(1);
    }
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        await imessage.shutdown();
        process.exit(0);
    });
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ Relay is now connected to BlueBubbles!               ║
║                                                           ║
║   • Text your iMessage number to interact                 ║
║   • Press Ctrl+C to stop                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=imessage-bluebubbles.js.map