import { BaseSkill } from './base-skill.js';
import { IntentContext, SkillResult } from '../types/index.js';
/**
 * Wallet Skill - Handles all wallet-related operations via chat
 *
 * Creates, manages, and displays wallet info - all in Gen Z speak
 */
export declare class WalletSkill extends BaseSkill {
    name: string;
    description: string;
    handledIntents: "wallet"[];
    private walletManager;
    constructor();
    validate(_context: IntentContext): Promise<{
        valid: boolean;
        error?: string;
    }>;
    execute(context: IntentContext): Promise<SkillResult>;
    private isCreateWallet;
    private isImportWallet;
    private isCheckBalance;
    private isShowWallets;
    private isShowHistory;
    private isPortfolio;
    private isSetDefault;
    private handleCreateWallet;
    private handleImportWallet;
    private handleCheckBalance;
    private handleShowWallets;
    private handleShowHistory;
    private handlePortfolio;
    private handleSetDefault;
    private handleWalletOverview;
    private formatBalance;
}
//# sourceMappingURL=wallet.skill.d.ts.map