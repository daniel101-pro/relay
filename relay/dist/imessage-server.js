import 'dotenv/config';
import { createRelayEngine } from './core/engine.js';
import { createWebhookServer } from './server/webhook-server.js';
/**
 * Relay iMessage Server
 *
 * This server connects Relay to iMessage via Sendblue.
 *
 * Setup:
 * 1. Sign up for Sendblue at https://sendblue.co
 * 2. Get your API key and secret from the dashboard
 * 3. Set up your webhook URL in Sendblue dashboard
 * 4. Add credentials to .env file
 *
 * Required environment variables:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - SENDBLUE_API_KEY: Your Sendblue API key
 * - SENDBLUE_API_SECRET: Your Sendblue API secret
 * - WEBHOOK_URL: Your public webhook URL (e.g., https://your-domain.com/webhook/imessage)
 * - PORT: Server port (default: 3001)
 */
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY - iMessage Integration                         ║
║   Blockchain banking through iMessage                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check required environment variables
    const requiredEnvVars = [
        'OPENAI_API_KEY',
        'SENDBLUE_API_KEY',
        'SENDBLUE_API_SECRET',
    ];
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   • ${key}`));
        console.error('\nPlease add these to your .env file');
        process.exit(1);
    }
    // Create Relay engine
    const engine = createRelayEngine({ debug: true });
    // Create webhook server
    const port = parseInt(process.env.PORT || '3001', 10);
    const webhookUrl = process.env.WEBHOOK_URL;
    const server = createWebhookServer(engine, {
        port,
        sendblue: {
            apiKey: process.env.SENDBLUE_API_KEY,
            apiSecret: process.env.SENDBLUE_API_SECRET,
            callbackUrl: webhookUrl ? `${webhookUrl}/webhook/imessage` : undefined,
        },
    });
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });
    // Start the server
    await server.start();
    console.log('\n📱 Ready to receive iMessages!');
    console.log('\nTo test locally:');
    console.log('1. Use ngrok to expose your server: ngrok http 3001');
    console.log('2. Set the ngrok URL as your webhook in Sendblue dashboard');
    console.log('3. Text your Sendblue number from any iPhone\n');
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=imessage-server.js.map