import 'dotenv/config';
import * as readline from 'readline';
import { createRelayEngine } from './core/engine.js';
import { MessageSource } from './types/index.js';
// Export everything for library usage
export * from './types/index.js';
export * from './core/index.js';
export * from './skills/index.js';
export * from './blockchain/index.js';
export * from './utils/index.js';
export * from './ai/openai.js';
export * from './channels/index.js';
export * from './server/index.js';
/**
 * Relay - The AI layer between you and the blockchain
 *
 * A chat-based AI agent that understands, explains, verifies,
 * and executes blockchain banking actions.
 */
// CLI Demo when run directly
async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 RELAY                                                ║
║   The AI layer between you and the blockchain             ║
║                                                           ║
║   Commands:                                               ║
║   • Type any message to interact                          ║
║   • "help" - Show capabilities                            ║
║   • "exit" - Quit                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Warning: OPENAI_API_KEY not set. Intent classification will fail.');
        console.log('   Create a .env file with your API key to enable full functionality.\n');
    }
    const engine = createRelayEngine({ debug: true });
    // Show capabilities
    console.log('📚 Available capabilities:');
    const capabilities = engine.getCapabilities();
    capabilities.forEach((cap) => {
        console.log(`   • ${cap.name}: ${cap.description}`);
    });
    console.log('');
    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const prompt = () => {
        rl.question('You: ', async (input) => {
            const trimmed = input.trim();
            if (!trimmed) {
                prompt();
                return;
            }
            if (trimmed.toLowerCase() === 'exit') {
                console.log('\n👋 Goodbye!\n');
                rl.close();
                process.exit(0);
            }
            if (trimmed.toLowerCase() === 'help') {
                console.log('\n📖 Relay Help');
                console.log('─'.repeat(50));
                console.log('\nExample messages to try:\n');
                console.log('🔍 Explain:');
                console.log('   "What is this transaction? 0x1234..."');
                console.log('   "Explain this address 0xabcd..."');
                console.log('\n✅ Verify:');
                console.log('   "Is this wallet safe? 0x1234..."');
                console.log('   "Can I trust this contract?"');
                console.log('\n🏗️  Create:');
                console.log('   "Create a multisig wallet"');
                console.log('   "Build a token contract"');
                console.log('\n💸 Send:');
                console.log('   "Send 0.1 ETH to vitalik.eth"');
                console.log('   "Transfer £50 to 0x1234..."');
                console.log('\n🧾 Proof:');
                console.log('   "Generate a receipt for 0x1234..."');
                console.log('   "Show me proof of my last payment"');
                console.log('\n🛡️  Safety:');
                console.log('   "Is this a scam?"');
                console.log('   "This looks suspicious..."');
                console.log('');
                prompt();
                return;
            }
            try {
                console.log('\n⏳ Processing...\n');
                const response = await engine.chat(trimmed, 'cli-user', MessageSource.CLI);
                console.log('─'.repeat(50));
                console.log('Relay:', response.message);
                console.log('─'.repeat(50));
                if (response.warnings.length > 0) {
                    console.log('\n⚠️  Warnings:');
                    response.warnings.forEach((w) => console.log(`   • ${w}`));
                }
                if (response.suggestions.length > 0) {
                    console.log('\n💡 Suggestions:');
                    response.suggestions.forEach((s) => console.log(`   • ${s}`));
                }
                if (response.processingTime) {
                    console.log(`\n⏱️  Processed in ${response.processingTime}ms`);
                }
                console.log('');
            }
            catch (error) {
                console.error('\n❌ Error:', error instanceof Error ? error.message : error);
                console.log('');
            }
            prompt();
        });
    };
    prompt();
}
// Run CLI if this is the main module
main().catch(console.error);
//# sourceMappingURL=index.js.map