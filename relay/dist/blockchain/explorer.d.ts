import { TransactionData, AddressInfo, ContractInfo } from './types.js';
/**
 * Explorer API wrapper for Etherscan/Basescan
 */
export declare class ExplorerAPI {
    private apiKeys;
    constructor();
    /**
     * Get the explorer API URL for a chain
     */
    private getApiUrl;
    /**
     * Get the explorer URL for a chain
     */
    getExplorerUrl(chainId: number): string;
    /**
     * Make an API request
     */
    private request;
    /**
     * Get transaction details
     */
    getTransaction(txHash: string, chainId?: number): Promise<TransactionData | null>;
    /**
     * Get address info
     */
    getAddressInfo(address: string, chainId?: number): Promise<AddressInfo | null>;
    /**
     * Get contract info
     */
    getContractInfo(address: string, chainId?: number): Promise<ContractInfo | null>;
    /**
     * Get recent transactions for an address
     */
    getRecentTransactions(address: string, chainId?: number, limit?: number): Promise<TransactionData[]>;
    /**
     * Get transaction URL for sharing
     */
    getTransactionUrl(txHash: string, chainId?: number): string;
    /**
     * Get address URL for sharing
     */
    getAddressUrl(address: string, chainId?: number): string;
}
export declare function getExplorerAPI(): ExplorerAPI;
//# sourceMappingURL=explorer.d.ts.map