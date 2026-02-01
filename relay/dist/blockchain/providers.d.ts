import { ethers } from 'ethers';
import { NetworkConfig } from './types.js';
/**
 * Network configurations
 */
export declare const NETWORKS: Record<number, NetworkConfig>;
/**
 * Multi-provider manager for blockchain interactions
 */
export declare class BlockchainProvider {
    private providers;
    private defaultChainId;
    constructor(defaultChainId?: number);
    /**
     * Get provider for a specific chain
     */
    getProvider(chainId?: number): ethers.JsonRpcProvider;
    /**
     * Get network config
     */
    getNetworkConfig(chainId?: number): NetworkConfig;
    /**
     * Get balance for an address
     */
    getBalance(address: string, chainId?: number): Promise<bigint>;
    /**
     * Get transaction by hash
     */
    getTransaction(txHash: string, chainId?: number): Promise<ethers.TransactionResponse | null>;
    /**
     * Get transaction receipt
     */
    getTransactionReceipt(txHash: string, chainId?: number): Promise<ethers.TransactionReceipt | null>;
    /**
     * Resolve ENS name to address
     */
    resolveENS(ensName: string): Promise<string | null>;
    /**
     * Lookup ENS name for address
     */
    lookupENS(address: string): Promise<string | null>;
    /**
     * Get current block number
     */
    getBlockNumber(chainId?: number): Promise<number>;
    /**
     * Check if address is a contract
     */
    isContract(address: string, chainId?: number): Promise<boolean>;
    /**
     * Get gas price
     */
    getGasPrice(chainId?: number): Promise<bigint>;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(tx: ethers.TransactionRequest, chainId?: number): Promise<bigint>;
    /**
     * Get all supported networks
     */
    getSupportedNetworks(): NetworkConfig[];
    /**
     * Detect network from address activity
     */
    detectNetwork(address: string): Promise<number | null>;
}
export declare function getBlockchainProvider(): BlockchainProvider;
//# sourceMappingURL=providers.d.ts.map