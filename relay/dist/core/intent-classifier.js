import { getAIClient } from '../ai/openai.js';
import { ClassifiedIntentSchema, IntentType, } from '../types/index.js';
const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for Relay, a crypto assistant.

Classify messages into ONE of these intents:

1. **wallet** - ANYTHING about creating/managing wallets or checking balances
   Examples: "create wallet", "make me a wallet", "can you create me a wallet", "new wallet", "balance", "my funds", "check my bag", "import wallet", "i need a wallet"
   IMPORTANT: If user mentions "wallet" and wants one created, this is ALWAYS "wallet" intent!

2. **explain** - Understanding transactions, addresses, or crypto concepts
   Examples: "what is 0x...", "explain this tx", "what happened here"

3. **verify** - Checking if something is safe/legit
   Examples: "is this safe", "is this legit", "can i trust this"

4. **create** - Creating SMART CONTRACTS or TOKENS only (NOT wallets!)
   Examples: "create a token", "deploy contract", "make an NFT contract", "build me a smart contract"
   NOTE: "create wallet" is NOT this! That's wallet intent.

5. **send** - Transferring/sending crypto
   Examples: "send 0.1 eth to...", "transfer to...", "pay..."

6. **proof** - Getting receipts/proof
   Examples: "get receipt", "proof of payment", "show receipt"

7. **safety** - Reporting suspicious activity
   Examples: "this is a scam", "flag this", "suspicious"

8. **unknown** - Greetings, general chat, or unclear messages
   Examples: "hi", "hello", "yo", "what's up", random text

CRITICAL RULES:
- If message contains "wallet" + (create/make/new/need/want) = ALWAYS "wallet"
- "create" intent is ONLY for smart contracts/tokens, NEVER for wallets
- When unsure, use "unknown" - it's handled gracefully

Response format:
{
  "type": "wallet|explain|verify|create|send|proof|safety|unknown",
  "confidence": 0.0-1.0,
  "entities": {
    "addresses": [],
    "transactionHashes": [],
    "ensNames": [],
    "amounts": [],
    "recipients": [],
    "contractTypes": []
  },
  "reasoning": "brief reason"
}`;
/**
 * Intent Classifier - Smart classification with fallbacks
 */
export class IntentClassifier {
    aiClient;
    constructor(aiClient) {
        this.aiClient = aiClient || getAIClient();
    }
    /**
     * Classify user message intent
     */
    async classify(message) {
        // First try quick pattern matching (no AI needed)
        const quickResult = this.quickClassify(message);
        if (quickResult) {
            console.log(`[Relay] Quick classified as: ${quickResult.type}`);
            return quickResult;
        }
        // Fall back to AI classification
        try {
            const result = await this.aiClient.getStructuredCompletion(INTENT_CLASSIFICATION_PROMPT, message, ClassifiedIntentSchema, { temperature: 0.1 });
            return result;
        }
        catch (error) {
            console.error('Intent classification error:', error);
            // On any error, return unknown - ChatSkill will handle it gracefully
            return this.createUnknownIntent('Classification failed, using chat fallback');
        }
    }
    /**
     * Quick pattern-based classification (no AI call needed)
     */
    quickClassify(message) {
        const msg = message.toLowerCase().trim();
        // Greetings -> unknown (ChatSkill handles these)
        const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'gm', 'gn', 'yoo', 'yooo', 'ayo', 'ayy', 'wassup', 'wsg'];
        if (greetings.some(g => msg === g || msg.startsWith(g + ' ') || msg.startsWith(g + '!'))) {
            return this.createUnknownIntent('Greeting detected');
        }
        // Wallet operations - MUST CHECK BEFORE OTHER PATTERNS
        const walletPatterns = [
            /\b(create|make|new|generate|gimme|give me|get|hook me up with)\s*(me\s*)?(a\s*)?(new\s*)?(crypto\s*)?(wallet|address)/i,
            /\bcan\s*(you|u|i)\s*(create|make|get|have)\s*(me\s*)?(a\s*)?(new\s*)?wallet/i,
            /\b(wallet|balance|portfolio|my funds|my money|my bag|check.*bag)/i,
            /\b(import|restore|recover)\s*(my\s*)?(wallet)/i,
            /\bhow much (do i have|i got)/i,
            /\bwhat('s| is) (in )?my (wallet|balance)/i,
            /\bi\s*(want|need)\s*(a\s*)?(new\s*)?wallet/i,
            /\bwallet\s*(pls|please|plz)/i,
            /\bneed\s*(a\s*)?(new\s*)?wallet/i,
            /\bset\s*up\s*(a\s*)?(my\s*)?wallet/i,
        ];
        if (walletPatterns.some(p => p.test(msg))) {
            return {
                type: IntentType.WALLET,
                confidence: 0.95,
                entities: this.extractEntities(message),
                reasoning: 'Wallet operation detected',
            };
        }
        // Send operations
        const sendPatterns = [
            /\b(send|transfer|pay)\s+\d/i,
            /\bsend\s+(to\s+)?0x/i,
            /\bsend\s+.*\.eth/i,
        ];
        if (sendPatterns.some(p => p.test(msg))) {
            return {
                type: IntentType.SEND,
                confidence: 0.9,
                entities: this.extractEntities(message),
                reasoning: 'Send operation detected',
            };
        }
        // Explain - has address or tx hash
        if (/0x[a-fA-F0-9]{40}/.test(message) || /0x[a-fA-F0-9]{64}/.test(message)) {
            // Check if it's a verify question
            if (/\b(safe|legit|trust|scam|sus)\b/i.test(msg)) {
                return {
                    type: IntentType.VERIFY,
                    confidence: 0.85,
                    entities: this.extractEntities(message),
                    reasoning: 'Verification question with address',
                };
            }
            return {
                type: IntentType.EXPLAIN,
                confidence: 0.85,
                entities: this.extractEntities(message),
                reasoning: 'Address or transaction hash detected',
            };
        }
        // Safety/scam concerns
        if (/\b(scam|rug|rugpull|suspicious|flag|report|phishing)\b/i.test(msg)) {
            return {
                type: IntentType.SAFETY,
                confidence: 0.85,
                entities: this.extractEntities(message),
                reasoning: 'Safety concern detected',
            };
        }
        // Help requests -> unknown (ChatSkill handles)
        if (/\b(help|what can you|how do i|how to)\b/i.test(msg)) {
            return this.createUnknownIntent('Help request');
        }
        // No quick match - let AI handle it
        return null;
    }
    /**
     * Create an unknown intent response
     */
    createUnknownIntent(reasoning) {
        return {
            type: IntentType.UNKNOWN,
            confidence: 0.5,
            entities: {
                addresses: [],
                transactionHashes: [],
                ensNames: [],
                amounts: [],
                recipients: [],
                contractTypes: [],
            },
            reasoning,
        };
    }
    /**
     * Extract entities from message
     */
    extractEntities(message) {
        const addresses = message.match(/0x[a-fA-F0-9]{40}/g) || [];
        const transactionHashes = message.match(/0x[a-fA-F0-9]{64}/g) || [];
        const ensNames = message.match(/\b[\w-]+\.eth\b/g) || [];
        // Extract amounts like "0.1 eth", "100 usdc", "$50"
        const amounts = [];
        const amountMatches = message.matchAll(/(\d+\.?\d*)\s*(eth|btc|usdc|usdt|dai|usd|\$|£|€)/gi);
        for (const match of amountMatches) {
            amounts.push({ value: match[1], currency: match[2].toUpperCase() });
        }
        return {
            addresses: [...new Set(addresses)],
            transactionHashes: [...new Set(transactionHashes)],
            ensNames: [...new Set(ensNames)],
            amounts,
            recipients: [],
            contractTypes: [],
        };
    }
    /**
     * Quick check if message likely contains blockchain entities
     */
    static hasBlockchainEntities(message) {
        const addressPattern = /0x[a-fA-F0-9]{40}/;
        const txHashPattern = /0x[a-fA-F0-9]{64}/;
        const ensPattern = /\b[\w-]+\.eth\b/;
        return (addressPattern.test(message) ||
            txHashPattern.test(message) ||
            ensPattern.test(message));
    }
    /**
     * Extract entities using regex (fast, no AI)
     */
    static extractEntitiesQuick(message) {
        const addresses = message.match(/0x[a-fA-F0-9]{40}/g) || [];
        const transactionHashes = message.match(/0x[a-fA-F0-9]{64}/g) || [];
        const ensNames = message.match(/\b[\w-]+\.eth\b/g) || [];
        return {
            addresses: [...new Set(addresses)],
            transactionHashes: [...new Set(transactionHashes)],
            ensNames: [...new Set(ensNames)],
        };
    }
}
// Default singleton
let defaultClassifier = null;
export function getIntentClassifier() {
    if (!defaultClassifier) {
        defaultClassifier = new IntentClassifier();
    }
    return defaultClassifier;
}
//# sourceMappingURL=intent-classifier.js.map