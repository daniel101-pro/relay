import 'dotenv/config';
import { createRelayEngine } from './core/engine.js';
import { JaredAdapter } from './channels/imessage/jared.js';
import { MessageSource } from './types/index.js';

/**
 * Relay Native iMessage Server
 *
 * This server connects Relay directly to your Mac's Messages app.
 * No third-party service needed - it runs entirely on your machine!
 *
 * Requirements:
 * 1. macOS with Messages.app signed into iMessage
 * 2. Grant Terminal/Node full disk access:
 *    System Preferences → Security & Privacy → Privacy → Full Disk Access
 * 3. Grant automation permission when prompted
 *
 * How it works:
 * - Monitors ~/Library/Messages/chat.db for incoming messages
 * - Processes messages through the Relay AI engine
 * - Sends responses via AppleScript to Messages.app
 */

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - Native iMessage                              ║
║   Blockchain banking through your Mac                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in .env file');
    process.exit(1);
  }

  // Check if we're on macOS
  if (process.platform !== 'darwin') {
    console.error('❌ Native iMessage only works on macOS');
    process.exit(1);
  }

  console.log('📱 Setting up native iMessage integration...\n');

  // Create Relay engine
  const engine = createRelayEngine({ debug: true });

  // Create native iMessage adapter
  const imessage = new JaredAdapter({
    pollInterval: 2000, // Check for new messages every 2 seconds
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
      const response = await engine.chat(
        message.text,
        message.senderId,
        MessageSource.IMESSAGE
      );

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
      } else {
        console.error('❌ Failed to send reply:', result.error);
      }
    } catch (error) {
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
  } catch (error) {
    console.error('❌ Failed to initialize:', error instanceof Error ? error.message : error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure Messages.app is set up with iMessage');
    console.log('   2. Grant Full Disk Access to Terminal:');
    console.log('      System Preferences → Security & Privacy → Privacy → Full Disk Access');
    console.log('   3. Try running: sqlite3 ~/Library/Messages/chat.db "SELECT 1"');
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
║   ✅ Relay is now monitoring your iMessages!              ║
║                                                           ║
║   • Text this Mac's iMessage number to interact           ║
║   • Press Ctrl+C to stop                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
