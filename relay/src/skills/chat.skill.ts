import { BaseSkill } from './base-skill.js';
import { IntentType, IntentContext, SkillResult, RiskLevel } from '../types/index.js';
import { AIClient, getAIClient } from '../ai/openai.js';

/**
 * Chat Skill - The brain of Relay
 *
 * Handles:
 * - Greetings and general conversation
 * - ANY question (crypto, life, whatever)
 * - Teaching crypto concepts in Gen Z speak
 * - Understanding messy/unclear messages
 * - Redirecting to specific skills when needed
 */
export class ChatSkill extends BaseSkill {
  name = 'chat';
  description = 'Handle general conversation, teach crypto, answer anything';
  handledIntents = [IntentType.UNKNOWN];

  private aiClient: AIClient;

  constructor() {
    super();
    this.aiClient = getAIClient();
  }

  async validate(_context: IntentContext): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }

  async execute(context: IntentContext): Promise<SkillResult> {
    const message = context.originalMessage.toLowerCase().trim();
    const originalMessage = context.originalMessage;

    // Check for greetings first
    if (this.isGreeting(message)) {
      return this.handleGreeting();
    }

    // Check for help requests
    if (this.isHelpRequest(message)) {
      return this.handleHelp();
    }

    // Check for capability questions
    if (this.isCapabilityQuestion(message)) {
      return this.handleCapabilities();
    }

    // Check for crypto education questions
    if (this.isCryptoQuestion(message)) {
      return this.handleCryptoEducation(originalMessage);
    }

    // For everything else - use AI to understand and respond
    return this.handleWithAI(originalMessage);
  }

  // ===== Detection Methods =====

  private isGreeting(message: string): boolean {
    const greetings = [
      'hi', 'hello', 'hey', 'yo', 'sup', 'whats up', "what's up", 'howdy',
      'hola', 'good morning', 'good afternoon', 'good evening', 'gm', 'gn',
      'wassup', 'yooo', 'ayy', 'ayo', 'waddup', 'wsg', 'heyyy', 'hiii',
      'morning', 'evening', 'afternoon', 'henlo', 'heyy', 'hihi', 'oi'
    ];

    // Check if message is just a greeting or starts with one
    return greetings.some(g =>
      message === g ||
      message.startsWith(g + ' ') ||
      message.startsWith(g + '!') ||
      message.startsWith(g + ',') ||
      message.startsWith(g + '.')
    );
  }

  private isHelpRequest(message: string): boolean {
    const helpWords = [
      'help', 'how do i', 'how to', 'commands', 'options', 'guide',
      'tutorial', 'teach me', 'show me how', 'what can i do', 'how does this work',
      'idk what to do', 'im lost', "i'm lost", 'confused', 'stuck'
    ];
    return helpWords.some(h => message.includes(h));
  }

  private isCapabilityQuestion(message: string): boolean {
    const patterns = [
      'what can you do', 'what do you do', 'who are you', 'what are you',
      'capabilities', 'features', 'what r u', 'wut can u do', 'ur capabilities',
      'what u do', 'wyd', 'what is relay', "what's relay"
    ];
    return patterns.some(p => message.includes(p));
  }

  private isCryptoQuestion(message: string): boolean {
    const cryptoTerms = [
      'what is', 'what are', 'what\'s', 'whats', 'wut is', 'wat is',
      'explain', 'tell me about', 'how does', 'why is', 'why do',
      'meaning of', 'define', 'eli5', 'break down'
    ];

    const cryptoTopics = [
      'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'nft',
      'defi', 'wallet', 'gas', 'token', 'coin', 'mining', 'staking',
      'yield', 'apy', 'liquidity', 'swap', 'dex', 'cex', 'web3',
      'smart contract', 'solidity', 'layer 2', 'l2', 'rollup', 'bridge',
      'airdrop', 'whitelist', 'mint', 'burn', 'hodl', 'fomo', 'fud',
      'rug', 'rugpull', 'ape', 'moon', 'pump', 'dump', 'whale',
      'seed phrase', 'private key', 'public key', 'address', 'hash',
      'transaction', 'block', 'node', 'validator', 'consensus', 'proof of',
      'dao', 'governance', 'multisig', 'cold wallet', 'hot wallet',
      'metamask', 'ledger', 'trezor', 'opensea', 'uniswap', 'base',
      'polygon', 'arbitrum', 'optimism', 'solana', 'avalanche'
    ];

    const hasQuestionPattern = cryptoTerms.some(t => message.includes(t));
    const hasCryptoTopic = cryptoTopics.some(t => message.includes(t));

    return hasQuestionPattern || hasCryptoTopic;
  }

  // ===== Handler Methods =====

  private handleGreeting(): SkillResult {
    const greetings = [
      `yooo what's good! 👋 i'm relay, ur crypto bestie fr fr

i gotchu with:
• 🔍 explain any tx or wallet
• ✅ verify if something's legit or sus
• 🏗️ create smart contracts
• 💸 send crypto anywhere
• 👛 manage ur wallets
• 🛡️ check if something's a scam

just hit me up with whatever - i gotchu 🚀`,

      `ayyy what's up! 👋 relay here

i'm basically ur crypto plug - i can:
• break down any transaction
• check if stuff is safe
• make wallets & contracts
• send ur crypto
• answer any crypto questions

what we getting into today? 💪`,

      `yo! 🔥 u reached relay

think of me as ur crypto homie that actually explains stuff

ask me anything or try:
• "create wallet"
• "what is ethereum"
• "check my balance"

lmk what u need fam 🤝`
    ];

    return {
      success: true,
      data: {
        type: 'greeting',
        message: greetings[Math.floor(Math.random() * greetings.length)],
      },
      riskLevel: RiskLevel.LOW,
      warnings: [],
    };
  }

  private handleHelp(): SkillResult {
    return {
      success: true,
      data: {
        type: 'help',
        message: `bet, lemme put u on 🔥

**👛 wallet stuff**
• "create wallet" - i'll make u a fresh one
• "balance" - check ur funds
• "portfolio" - see all ur wallets
• "import wallet" - bring ur existing one

**🔍 understanding crypto**
• "what is [anything]" - i'll explain it
• "explain this tx 0x..." - break down any transaction
• just paste any address or tx hash

**💸 moving money**
• "send 0.1 eth to vitalik.eth"
• "send to 0x..."

**🛡️ staying safe**
• "is this safe?" + paste address
• "verify this contract"
• "this looks sus"

**🏗️ building**
• "create a token"
• "make me a multisig"

or just ask me anything - i'm not just buttons fam, talk to me like a person 💯`,
      },
      riskLevel: RiskLevel.LOW,
      warnings: [],
    };
  }

  private handleCapabilities(): SkillResult {
    return {
      success: true,
      data: {
        type: 'capabilities',
        message: `i'm relay - ur all-in-one crypto assistant 🔐

**the vibes:**
i'm not like those boring bots that only respond to exact commands. talk to me however u want - typos, slang, questions, random thoughts - i'll figure it out

**what i actually do:**

1️⃣ **wallet management** - create wallets, check balances, see ur portfolio
2️⃣ **explain anything** - transactions, addresses, crypto concepts
3️⃣ **verify safety** - check if addresses/contracts are legit
4️⃣ **send crypto** - transfer eth, tokens, to anyone
5️⃣ **create contracts** - tokens, multisigs, NFTs from plain english
6️⃣ **teach crypto** - ask me literally anything about crypto

**try these:**
• "make me a wallet"
• "what's a rug pull"
• "check 0x..."
• "is eth a good investment"
• "create a meme token"

i'm on ethereum & base 🔗

shoot ur shot - what u wanna know? 🎯`,
      },
      riskLevel: RiskLevel.LOW,
      warnings: [],
    };
  }

  private async handleCryptoEducation(message: string): Promise<SkillResult> {
    const systemPrompt = `You are Relay, a Gen Z crypto educator. Your job is to explain crypto concepts in a fun, casual way that anyone can understand.

PERSONALITY:
- Use Gen Z slang naturally: no cap, fr fr, lowkey, highkey, bet, bussin, slay, sus, valid, based, W, L, ngl, idk, rn, tbh, bruh, fam, hits different, it's giving, say less, rent free, the vibes
- Keep explanations SHORT but complete (2-3 paragraphs max)
- Use emojis but don't overdo it
- Use analogies to real life that Gen Z would understand
- Be encouraging, not condescending
- If something is risky, keep it real about that

STRUCTURE:
1. Quick one-line answer
2. Simple explanation with an analogy
3. Why it matters / real talk
4. Optional: quick tip or warning

TOPICS YOU'RE EXPERT IN:
- Blockchain basics
- Ethereum, Bitcoin, altcoins
- DeFi (swaps, yields, liquidity)
- NFTs
- Smart contracts
- Wallets and security
- Gas fees
- Layer 2s
- Trading terms (HODL, FOMO, etc.)
- Scams and how to avoid them

Remember: you're their crypto-savvy friend, not a textbook. Make it click for them.`;

    try {
      const response = await this.aiClient.getCompletion(
        systemPrompt,
        message,
        { temperature: 0.8, maxTokens: 500 }
      );

      return {
        success: true,
        data: {
          type: 'education',
          message: response,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return this.handleUnknown();
    }
  }

  private async handleWithAI(message: string): Promise<SkillResult> {
    const systemPrompt = `You are Relay, a Gen Z crypto assistant chatbot. You can have normal conversations AND help with crypto.

PERSONALITY:
- Casual, friendly, uses Gen Z slang naturally
- Helpful but not robotic
- Can joke around but stays useful
- Keeps it real - if you don't know something, say so

YOUR CAPABILITIES (mention these when relevant):
- Create and manage wallets (say "create wallet", "balance", "portfolio")
- Explain transactions and addresses (paste any 0x address or tx hash)
- Verify if things are safe
- Send crypto
- Create smart contracts from descriptions
- Answer any crypto questions

IMPORTANT RULES:
1. If someone's message is unclear/messy, try to understand what they MEANT, don't just say "I don't understand"
2. If they seem to want a specific action (wallet, send, verify), guide them to the right command
3. If they're just chatting, chat back naturally
4. If they ask something non-crypto, you can still engage but gently mention your crypto skills
5. Keep responses concise - no essays
6. Use lowercase mostly, add relevant emojis

EXAMPLES OF HANDLING MESSY MESSAGES:
- "i wan send mony" → understand they want to send crypto, help them
- "waht is my balence" → they want balance check
- "crete walet pls" → they want a new wallet
- "is this addres safe 0x..." → they want verification
- "random gibberish" → ask what they need help with, give examples

BE ADAPTIVE. FIGURE OUT WHAT THEY NEED.`;

    try {
      const response = await this.aiClient.getCompletion(
        systemPrompt,
        message,
        { temperature: 0.85, maxTokens: 400 }
      );

      return {
        success: true,
        data: {
          type: 'conversation',
          message: response,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return this.handleUnknown();
    }
  }

  private handleUnknown(): SkillResult {
    const responses = [
      `hmm not 100% sure what u mean but i'm here for it 😅

try:
• "create wallet" - make a new wallet
• "balance" - check ur funds
• "help" - see everything i can do
• or just ask me any crypto question

what's up? 🤝`,

      `yo i might've missed that one 😅

u can:
• ask me about crypto (anything)
• say "wallet" to manage ur bags
• paste any address or tx
• or just chat with me

what u need fam?`,

      `i'm a lil confused rn ngl 🤔

but hey try:
• "help" - see what i do
• "create wallet" - get started
• ask any question about crypto

i gotchu once i know what u need 💯`
    ];

    return {
      success: true,
      data: {
        type: 'unknown',
        message: responses[Math.floor(Math.random() * responses.length)],
      },
      riskLevel: RiskLevel.LOW,
      warnings: [],
    };
  }
}
