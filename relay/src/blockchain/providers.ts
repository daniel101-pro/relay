import { ethers } from 'ethers';
import { NetworkConfig, NetworkId } from './types.js';

/**
 * Network configurations
 */
export const NETWORKS: Record<number, NetworkConfig> = {
  [NetworkId.ETHEREUM_MAINNET]: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  [NetworkId.ETHEREUM_SEPOLIA]: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
  [NetworkId.BASE_MAINNET]: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  [NetworkId.BASE_SEPOLIA]: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    explorerUrl: 'https://sepolia.basescan.org',
    explorerApiUrl: 'https://api-sepolia.basescan.org/api',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
};

/**
 * Multi-provider manager for blockchain interactions
 */
export class BlockchainProvider {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private defaultChainId: number;

  constructor(defaultChainId: number = NetworkId.ETHEREUM_MAINNET) {
    this.defaultChainId = defaultChainId;
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chainId?: number): ethers.JsonRpcProvider {
    const targetChainId = chainId || this.defaultChainId;

    if (!this.providers.has(targetChainId)) {
      const network = NETWORKS[targetChainId];
      if (!network) {
        throw new Error(`Unsupported chain ID: ${targetChainId}`);
      }

      const provider = new ethers.JsonRpcProvider(network.rpcUrl, {
        chainId: targetChainId,
        name: network.name,
      });

      this.providers.set(targetChainId, provider);
    }

    return this.providers.get(targetChainId)!;
  }

  /**
   * Get network config
   */
  getNetworkConfig(chainId?: number): NetworkConfig {
    const targetChainId = chainId || this.defaultChainId;
    const network = NETWORKS[targetChainId];

    if (!network) {
      throw new Error(`Unsupported chain ID: ${targetChainId}`);
    }

    return network;
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string, chainId?: number): Promise<bigint> {
    const provider = this.getProvider(chainId);
    return provider.getBalance(address);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(
    txHash: string,
    chainId?: number
  ): Promise<ethers.TransactionResponse | null> {
    const provider = this.getProvider(chainId);
    return provider.getTransaction(txHash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string,
    chainId?: number
  ): Promise<ethers.TransactionReceipt | null> {
    const provider = this.getProvider(chainId);
    return provider.getTransactionReceipt(txHash);
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENS(ensName: string): Promise<string | null> {
    const provider = this.getProvider(NetworkId.ETHEREUM_MAINNET);
    return provider.resolveName(ensName);
  }

  /**
   * Lookup ENS name for address
   */
  async lookupENS(address: string): Promise<string | null> {
    const provider = this.getProvider(NetworkId.ETHEREUM_MAINNET);
    return provider.lookupAddress(address);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(chainId?: number): Promise<number> {
    const provider = this.getProvider(chainId);
    return provider.getBlockNumber();
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string, chainId?: number): Promise<boolean> {
    const provider = this.getProvider(chainId);
    const code = await provider.getCode(address);
    return code !== '0x';
  }

  /**
   * Get gas price
   */
  async getGasPrice(chainId?: number): Promise<bigint> {
    const provider = this.getProvider(chainId);
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    tx: ethers.TransactionRequest,
    chainId?: number
  ): Promise<bigint> {
    const provider = this.getProvider(chainId);
    return provider.estimateGas(tx);
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks(): NetworkConfig[] {
    return Object.values(NETWORKS);
  }

  /**
   * Detect network from address activity
   */
  async detectNetwork(address: string): Promise<number | null> {
    // Check each network for activity
    for (const [chainId, _network] of Object.entries(NETWORKS)) {
      try {
        const balance = await this.getBalance(address, parseInt(chainId));
        if (balance > 0n) {
          return parseInt(chainId);
        }
      } catch {
        // Network not available or address not found
        continue;
      }
    }
    return null;
  }
}

// Default singleton
let defaultProvider: BlockchainProvider | null = null;

export function getBlockchainProvider(): BlockchainProvider {
  if (!defaultProvider) {
    defaultProvider = new BlockchainProvider();
  }
  return defaultProvider;
}
