import { ethers } from 'ethers';
/**
 * Wallet data structure
 */
export interface WalletData {
    address: string;
    name: string;
    createdAt: Date;
    network: 'ethereum' | 'base';
    isDefault: boolean;
}
export interface WalletBalance {
    address: string;
    eth: string;
    ethUsd: string;
    tokens: TokenBalance[];
    totalUsd: string;
}
export interface TokenBalance {
    symbol: string;
    name: string;
    balance: string;
    usdValue: string;
    contractAddress: string;
}
export interface TransactionHistory {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: Date;
    status: 'success' | 'failed' | 'pending';
    type: 'send' | 'receive' | 'contract';
}
/**
 * Wallet Manager - Handles wallet creation, storage, and operations
 */
export declare class WalletManager {
    private storePath;
    private encryptionKey;
    private providers;
    private ethPrice;
    constructor(storePath?: string);
    /**
     * Generate a default encryption key (should use env var in production)
     */
    private generateDefaultKey;
    /**
     * Encrypt data
     */
    private encrypt;
    /**
     * Decrypt data
     */
    private decrypt;
    /**
     * Load wallet store
     */
    private loadStore;
    /**
     * Save wallet store
     */
    private saveStore;
    /**
     * Create a new wallet
     */
    createWallet(name?: string, network?: 'ethereum' | 'base'): Promise<{
        wallet: WalletData;
        mnemonic: string;
        privateKey: string;
    }>;
    /**
     * Import wallet from private key
     */
    importWallet(privateKey: string, name?: string, network?: 'ethereum' | 'base'): Promise<WalletData>;
    /**
     * Import wallet from mnemonic
     */
    importFromMnemonic(mnemonic: string, name?: string, network?: 'ethereum' | 'base'): Promise<WalletData>;
    /**
     * Get all wallets
     */
    getWallets(): WalletData[];
    /**
     * Get default wallet
     */
    getDefaultWallet(): WalletData | null;
    /**
     * Set default wallet
     */
    setDefaultWallet(address: string): boolean;
    /**
     * Get wallet balance
     */
    getBalance(address: string, network?: 'ethereum' | 'base'): Promise<WalletBalance>;
    /**
     * Get all balances for all wallets
     */
    getAllBalances(): Promise<Map<string, WalletBalance>>;
    /**
     * Get transaction history
     */
    getTransactionHistory(address: string, network?: 'ethereum' | 'base', limit?: number): Promise<TransactionHistory[]>;
    /**
     * Get signer for transactions
     */
    getSigner(address: string, network?: 'ethereum' | 'base'): ethers.Wallet | null;
    /**
     * Send transaction
     */
    sendTransaction(fromAddress: string, toAddress: string, amount: string, network?: 'ethereum' | 'base'): Promise<{
        hash: string;
        status: string;
    }>;
    /**
     * Fetch ETH price
     */
    private fetchEthPrice;
    /**
     * Rename wallet
     */
    renameWallet(address: string, newName: string): boolean;
    /**
     * Delete wallet
     */
    deleteWallet(address: string): boolean;
    /**
     * Get portfolio summary
     */
    getPortfolioSummary(): Promise<{
        totalValueUsd: string;
        walletCount: number;
        wallets: Array<WalletData & {
            balance: WalletBalance;
        }>;
    }>;
}
export declare function getWalletManager(): WalletManager;
//# sourceMappingURL=wallet-manager.d.ts.map