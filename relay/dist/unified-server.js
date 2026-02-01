import 'dotenv/config';
import { createRelayEngine } from './core/engine.js';
import { WhatsAppWebAdapter } from './channels/whatsapp/whatsapp-web.js';
import { JaredAdapter } from './channels/imessage/jared.js';
import { MessageSource } from './types/index.js';
/**
 * Relay Unified Server
 *
 * Runs BOTH iMessage and WhatsApp on the same phone number!
 * Anyone can message your number from either platform and Relay responds.
 *
 * How it works:
 * - Uses your Mac's iMessage (linked to your phone number)
 * - Uses WhatsApp Web (linked to your phone number)
 * - Same number, both platforms, one AI agent
 *
 * Requirements:
 * - macOS with iMessage signed in to your phone number
 * - WhatsApp account on the same phone number
 * - Full Disk Access permission for Terminal
 */
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - Unified Messaging Server                     ║
║   One number for iMessage + WhatsApp                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not set in .env file');
        process.exit(1);
    }
    // Create Relay engine
    const engine = createRelayEngine({ debug: true });
    // Unified message handler
    const handleMessage = async (message, source, adapter) => {
        const platform = source === MessageSource.IMESSAGE ? 'iMessage' : 'WhatsApp';
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📨 [${platform}] From: ${message.senderPhone}`);
        console.log(`💬 Message: ${message.text}`);
        console.log(`${'─'.repeat(50)}\n`);
        try {
            // Process with Relay
            console.log('⏳ Processing with Relay...\n');
            const response = await engine.chat(message.text, message.senderId, source);
            console.log('📤 Response:');
            console.log(response.message);
            console.log('');
            // Send response back
            const result = await adapter.sendWithTyping({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: response.message,
            });
            if (result.success) {
                console.log(`✅ [${platform}] Reply sent successfully\n`);
            }
            else {
                console.error(`❌ [${platform}] Failed to send reply:`, result.error);
            }
        }
        catch (error) {
            console.error('❌ Error:', error);
            // Send error message
            await adapter.send({
                recipientId: message.senderId,
                recipientPhone: message.senderPhone,
                text: "Sorry, I encountered an error processing your message. Please try again.",
            });
        }
    };
    // Track which channels are active
    const channels = [];
    // ═══════════════════════════════════════════════════════════
    // Initialize WhatsApp
    // ═══════════════════════════════════════════════════════════
    console.log('\n📱 Setting up WhatsApp...\n');
    const whatsapp = new WhatsAppWebAdapter({
        sessionPath: './.wwebjs_auth',
    });
    whatsapp.onMessage(async (message) => {
        await handleMessage(message, MessageSource.WHATSAPP, whatsapp);
    });
    try {
        await whatsapp.initialize();
        channels.push({ name: 'WhatsApp', active: true });
    }
    catch (error) {
        console.error('⚠️ WhatsApp failed to initialize:', error instanceof Error ? error.message : error);
        console.log('   Continuing without WhatsApp...\n');
        channels.push({ name: 'WhatsApp', active: false });
    }
    // ═══════════════════════════════════════════════════════════
    // Initialize iMessage (Native)
    // ═══════════════════════════════════════════════════════════
    console.log('\n📱 Setting up iMessage...\n');
    let imessage = null;
    // Only try iMessage on macOS
    if (process.platform === 'darwin') {
        imessage = new JaredAdapter({
            pollInterval: 2000,
        });
        imessage.onMessage(async (message) => {
            await handleMessage(message, MessageSource.IMESSAGE, imessage);
        });
        try {
            await imessage.initialize();
            channels.push({ name: 'iMessage', active: true });
        }
        catch (error) {
            console.error('⚠️ iMessage failed to initialize:', error instanceof Error ? error.message : error);
            console.log('   Make sure you have Full Disk Access enabled for Terminal');
            console.log('   Continuing without iMessage...\n');
            channels.push({ name: 'iMessage', active: false });
        }
    }
    else {
        console.log('   ⚠️ iMessage only available on macOS');
        channels.push({ name: 'iMessage', active: false });
    }
    // Check if at least one channel is active
    const activeChannels = channels.filter(c => c.active);
    if (activeChannels.length === 0) {
        console.error('\n❌ No messaging channels could be initialized!');
        process.exit(1);
    }
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        await whatsapp.shutdown();
        if (imessage)
            await imessage.shutdown();
        process.exit(0);
    });
    // Print status
    const statusLines = channels.map(c => `║   ${c.active ? '✅' : '❌'} ${c.name.padEnd(20)} ${c.active ? 'Connected' : 'Not available'}`.padEnd(58) + '║');
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 RELAY IS RUNNING                                     ║
║                                                           ║
${statusLines.join('\n')}
║                                                           ║
║   Message your phone number from either platform!         ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=unified-server.js.map