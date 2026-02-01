import { BaseSkill } from './base-skill.js';
import { IntentType, IntentContext, SkillResult, RiskLevel } from '../types/index.js';
import { getWalletManager, WalletManager, WalletData, WalletBalance } from '../wallet/wallet-manager.js';

/**
 * Wallet Skill - Handles all wallet-related operations via chat
 *
 * Creates, manages, and displays wallet info - all in Gen Z speak
 */
export class WalletSkill extends BaseSkill {
  name = 'wallet';
  description = 'Create and manage crypto wallets';
  handledIntents = [IntentType.WALLET];

  private walletManager: WalletManager;

  constructor() {
    super();
    this.walletManager = getWalletManager();
  }

  async validate(_context: IntentContext): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }

  async execute(context: IntentContext): Promise<SkillResult> {
    const message = context.originalMessage.toLowerCase();

    // Determine wallet action
    if (this.isCreateWallet(message)) {
      return this.handleCreateWallet(message);
    }

    if (this.isImportWallet(message)) {
      return this.handleImportWallet(message, context.originalMessage);
    }

    if (this.isCheckBalance(message)) {
      return this.handleCheckBalance(message);
    }

    if (this.isShowWallets(message)) {
      return this.handleShowWallets();
    }

    if (this.isShowHistory(message)) {
      return this.handleShowHistory(message);
    }

    if (this.isPortfolio(message)) {
      return this.handlePortfolio();
    }

    if (this.isSetDefault(message)) {
      return this.handleSetDefault(message, context.originalMessage);
    }

    // Default - show wallet overview
    return this.handleWalletOverview();
  }

  // ===== Detection Methods =====

  private isCreateWallet(message: string): boolean {
    // Match various ways people ask for wallets
    const patterns = [
      /create\s*(a\s*)?(new\s*)?wallet/i,
      /make\s*(me\s*)?(a\s*)?(new\s*)?wallet/i,
      /new\s*wallet/i,
      /generate\s*(a\s*)?wallet/i,
      /gimme\s*(a\s*)?wallet/i,
      /give\s*me\s*(a\s*)?wallet/i,
      /need\s*(a\s*)?wallet/i,
      /want\s*(a\s*)?wallet/i,
      /set\s*up\s*(a\s*)?wallet/i,
      /setup\s*wallet/i,
      /get\s*(me\s*)?(a\s*)?wallet/i,
      /i\s*want\s*(a\s*)?wallet/i,
      /i\s*need\s*(a\s*)?wallet/i,
      /wallet\s*pls/i,
      /wallet\s*please/i,
      /can\s*(i|u|you)\s*(get|have|make)\s*(me\s*)?(a\s*)?wallet/i,
      /hook\s*me\s*up\s*(with\s*)?(a\s*)?wallet/i,
    ];
    return patterns.some(p => p.test(message));
  }

  private isImportWallet(message: string): boolean {
    const patterns = [
      'import wallet', 'import my wallet', 'add wallet', 'restore wallet',
      'recover wallet', 'use my wallet', 'connect wallet', 'bring my wallet'
    ];
    return patterns.some(p => message.includes(p));
  }

  private isCheckBalance(message: string): boolean {
    const patterns = [
      'balance', 'how much', 'what do i have', 'my funds', 'my money',
      'check balance', 'show balance', 'wallet balance', 'my eth', 'my crypto',
      'what\'s in my wallet', 'bag check', 'check my bag', 'how rich'
    ];
    return patterns.some(p => message.includes(p));
  }

  private isShowWallets(message: string): boolean {
    const patterns = [
      'my wallets', 'show wallets', 'list wallets', 'all wallets',
      'which wallets', 'what wallets', 'wallets i have'
    ];
    return patterns.some(p => message.includes(p));
  }

  private isShowHistory(message: string): boolean {
    const patterns = [
      'history', 'transactions', 'recent', 'activity', 'tx history',
      'what happened', 'show transactions', 'my txs', 'recent txs'
    ];
    return patterns.some(p => message.includes(p));
  }

  private isPortfolio(message: string): boolean {
    const patterns = [
      'portfolio', 'total', 'net worth', 'overview', 'summary',
      'all my money', 'everything', 'full balance'
    ];
    return patterns.some(p => message.includes(p));
  }

  private isSetDefault(message: string): boolean {
    const patterns = [
      'set default', 'make default', 'use this wallet', 'switch wallet',
      'change wallet', 'primary wallet'
    ];
    return patterns.some(p => message.includes(p));
  }

  // ===== Handler Methods =====

  private async handleCreateWallet(message: string): Promise<SkillResult> {
    // Extract wallet name if provided
    const nameMatch = message.match(/(?:called?|named?)\s+["']?([^"']+)["']?/i);
    const walletName = nameMatch?.[1]?.trim();

    // Determine network
    const network = message.includes('base') ? 'base' : 'ethereum';

    try {
      const result = await this.walletManager.createWallet(walletName, network);

      return {
        success: true,
        data: {
          type: 'wallet_created',
          message: `yooo just cooked up a fresh wallet for u 🔥

**${result.wallet.name}**
📍 \`${result.wallet.address}\`
🔗 ${network}

⚠️ **YO LISTEN UP - this is important fr fr:**

**ur seed phrase (SAVE THIS RN):**
\`\`\`
${result.mnemonic}
\`\`\`

🚨 **no cap - write this down somewhere SAFE**
• never share this with ANYONE
• if u lose it, ur funds are gone forever
• screenshot and delete? nah fam, write it on paper

**private key:**
\`\`\`
${result.privateKey}
\`\`\`

once u saved that, ur ready to receive crypto!
send eth to ur address and say "balance" to check it 💰`,
          wallet: result.wallet,
          mnemonic: result.mnemonic,
        },
        riskLevel: RiskLevel.MEDIUM,
        warnings: ['Save your seed phrase securely - it cannot be recovered!'],
      };
    } catch (error) {
      return {
        success: false,
        error: `couldn't create wallet rn: ${error instanceof Error ? error.message : 'unknown error'}`,
        warnings: [],
      };
    }
  }

  private async handleImportWallet(message: string, originalMessage: string): Promise<SkillResult> {
    // Try to extract private key or mnemonic
    const pkMatch = originalMessage.match(/0x[a-fA-F0-9]{64}/);
    const mnemonicMatch = originalMessage.match(/(?:\b\w+\b\s+){11,23}\b\w+\b/);

    if (!pkMatch && !mnemonicMatch) {
      return {
        success: true,
        data: {
          type: 'import_instructions',
          message: `bet, let's import ur wallet 🔐

send me either:

**option 1 - private key:**
\`import wallet 0x1234...your_private_key\`

**option 2 - seed phrase:**
\`import wallet word1 word2 word3... (12 or 24 words)\`

⚠️ **heads up:**
• make sure ur in a private chat
• never share these with anyone else
• i store them encrypted on ur device only

drop it when ur ready 👇`,
        },
        riskLevel: RiskLevel.MEDIUM,
        warnings: [],
      };
    }

    const network = message.includes('base') ? 'base' : 'ethereum';

    try {
      let wallet: WalletData;

      if (pkMatch) {
        wallet = await this.walletManager.importWallet(pkMatch[0], undefined, network);
      } else if (mnemonicMatch) {
        wallet = await this.walletManager.importFromMnemonic(mnemonicMatch[0], undefined, network);
      } else {
        throw new Error('Could not parse wallet credentials');
      }

      return {
        success: true,
        data: {
          type: 'wallet_imported',
          message: `wallet imported successfully! 🎉

**${wallet.name}**
📍 \`${wallet.address}\`
🔗 ${network}

ur good to go! say "balance" to check ur funds 💰`,
          wallet,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        error: `couldn't import wallet: ${error instanceof Error ? error.message : 'check ur key/phrase'}`,
        warnings: [],
      };
    }
  }

  private async handleCheckBalance(_message: string): Promise<SkillResult> {
    const wallet = this.walletManager.getDefaultWallet();

    if (!wallet) {
      return {
        success: true,
        data: {
          type: 'no_wallet',
          message: `u don't have a wallet yet fam 😅

say **"create wallet"** and i'll make one for u rq

or **"import wallet"** if u already got one 🔐`,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    try {
      const balance = await this.walletManager.getBalance(wallet.address, wallet.network);

      return {
        success: true,
        data: {
          type: 'balance',
          message: this.formatBalance(wallet, balance),
          wallet,
          balance,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        error: `couldn't fetch balance rn: ${error instanceof Error ? error.message : 'network issues maybe'}`,
        warnings: [],
      };
    }
  }

  private async handleShowWallets(): Promise<SkillResult> {
    const wallets = this.walletManager.getWallets();

    if (wallets.length === 0) {
      return {
        success: true,
        data: {
          type: 'no_wallets',
          message: `no wallets yet fam 📭

say **"create wallet"** to get started!`,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    let message = `**ur wallets** 👛\n\n`;

    for (const wallet of wallets) {
      const defaultBadge = wallet.isDefault ? ' ⭐ (default)' : '';
      message += `**${wallet.name}**${defaultBadge}\n`;
      message += `📍 \`${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}\`\n`;
      message += `🔗 ${wallet.network}\n\n`;
    }

    message += `say **"balance"** to check any wallet\nor **"portfolio"** for the full overview 📊`;

    return {
      success: true,
      data: {
        type: 'wallet_list',
        message,
        wallets,
      },
      riskLevel: RiskLevel.LOW,
      warnings: [],
    };
  }

  private async handleShowHistory(_message: string): Promise<SkillResult> {
    const wallet = this.walletManager.getDefaultWallet();

    if (!wallet) {
      return {
        success: true,
        data: {
          type: 'no_wallet',
          message: `u need a wallet first to see history fam\n\nsay **"create wallet"** to get started 🚀`,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    try {
      const history = await this.walletManager.getTransactionHistory(wallet.address, wallet.network);

      if (history.length === 0) {
        return {
          success: true,
          data: {
            type: 'empty_history',
            message: `no transactions yet for **${wallet.name}** 📭

ur wallet is fresh! once u send or receive crypto, it'll show up here 👀`,
          },
          riskLevel: RiskLevel.LOW,
          warnings: [],
        };
      }

      let message = `**recent activity for ${wallet.name}** 📜\n\n`;

      for (const tx of history.slice(0, 5)) {
        const emoji = tx.type === 'send' ? '📤' : '📥';
        const direction = tx.type === 'send' ? 'sent to' : 'received from';
        const other = tx.type === 'send' ? tx.to : tx.from;
        const status = tx.status === 'success' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';

        message += `${emoji} ${status} **${tx.value} ETH** ${direction}\n`;
        message += `   \`${other.slice(0, 10)}...${other.slice(-6)}\`\n`;
        message += `   ${tx.timestamp.toLocaleDateString()}\n\n`;
      }

      message += `want details on any tx? send me the hash 🔍`;

      return {
        success: true,
        data: {
          type: 'history',
          message,
          history,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        error: `couldn't fetch history: ${error instanceof Error ? error.message : 'api issues'}`,
        warnings: [],
      };
    }
  }

  private async handlePortfolio(): Promise<SkillResult> {
    try {
      const portfolio = await this.walletManager.getPortfolioSummary();

      if (portfolio.walletCount === 0) {
        return {
          success: true,
          data: {
            type: 'no_wallets',
            message: `no wallets to show fam 📭\n\nsay **"create wallet"** to start building ur bag 💰`,
          },
          riskLevel: RiskLevel.LOW,
          warnings: [],
        };
      }

      let message = `**📊 portfolio overview**\n\n`;
      message += `**total value:** ${portfolio.totalValueUsd} 💰\n`;
      message += `**wallets:** ${portfolio.walletCount}\n\n`;
      message += `---\n\n`;

      for (const wallet of portfolio.wallets) {
        const defaultBadge = wallet.isDefault ? ' ⭐' : '';
        message += `**${wallet.name}**${defaultBadge}\n`;
        message += `📍 \`${wallet.address.slice(0, 10)}...${wallet.address.slice(-6)}\`\n`;
        message += `💎 ${wallet.balance.eth} ETH (${wallet.balance.ethUsd})\n`;
        message += `🔗 ${wallet.network}\n\n`;
      }

      message += `---\n\nur bags looking ${parseFloat(portfolio.totalValueUsd.replace('$', '')) > 1000 ? 'fire 🔥' : 'ready to grow 📈'}`;

      return {
        success: true,
        data: {
          type: 'portfolio',
          message,
          portfolio,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        error: `couldn't load portfolio: ${error instanceof Error ? error.message : 'something went wrong'}`,
        warnings: [],
      };
    }
  }

  private async handleSetDefault(message: string, originalMessage: string): Promise<SkillResult> {
    // Try to extract address
    const addressMatch = originalMessage.match(/0x[a-fA-F0-9]{40}/i);

    if (!addressMatch) {
      const wallets = this.walletManager.getWallets();

      if (wallets.length === 0) {
        return {
          success: true,
          data: {
            type: 'no_wallets',
            message: `no wallets to set as default fam\n\nsay **"create wallet"** first!`,
          },
          riskLevel: RiskLevel.LOW,
          warnings: [],
        };
      }

      let message = `which wallet should be default? 🎯\n\n`;
      for (const w of wallets) {
        const badge = w.isDefault ? ' ⭐ (current)' : '';
        message += `• **${w.name}**${badge}\n  \`${w.address}\`\n\n`;
      }
      message += `copy the address and say:\n**"set default 0x..."**`;

      return {
        success: true,
        data: {
          type: 'select_wallet',
          message,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    const success = this.walletManager.setDefaultWallet(addressMatch[0]);

    if (success) {
      return {
        success: true,
        data: {
          type: 'default_set',
          message: `bet! ⭐ default wallet updated\n\nall ur sends will use this wallet now`,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    return {
      success: false,
      error: `couldn't find that wallet address fam`,
      warnings: [],
    };
  }

  private async handleWalletOverview(): Promise<SkillResult> {
    const wallets = this.walletManager.getWallets();

    if (wallets.length === 0) {
      return {
        success: true,
        data: {
          type: 'wallet_intro',
          message: `yo! let's get u set up with a wallet 🔐

**what u can do:**
• **"create wallet"** - i'll make a fresh one
• **"import wallet"** - bring ur existing one

once ur set up:
• **"balance"** - check ur funds
• **"portfolio"** - see everything
• **"history"** - ur recent txs
• **"send 0.1 eth to..."** - move ur crypto

what we doing? 🚀`,
        },
        riskLevel: RiskLevel.LOW,
        warnings: [],
      };
    }

    // Return quick balance check
    return this.handleCheckBalance('balance');
  }

  // ===== Helper Methods =====

  private formatBalance(wallet: WalletData, balance: WalletBalance): string {
    const emoji = parseFloat(balance.eth) > 0 ? '💰' : '📭';

    let message = `**${wallet.name}** ${emoji}\n\n`;
    message += `📍 \`${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}\`\n`;
    message += `🔗 ${wallet.network}\n\n`;
    message += `**balance:**\n`;
    message += `💎 **${balance.eth} ETH**\n`;
    message += `💵 ${balance.ethUsd}\n`;

    if (balance.tokens.length > 0) {
      message += `\n**tokens:**\n`;
      for (const token of balance.tokens) {
        message += `• ${token.balance} ${token.symbol} (${token.usdValue})\n`;
      }
    }

    message += `\n---\n**total:** ${balance.totalUsd}`;

    if (parseFloat(balance.eth) === 0) {
      message += `\n\nur wallet's empty rn - send some eth to that address to get started! 🚀`;
    }

    return message;
  }
}
