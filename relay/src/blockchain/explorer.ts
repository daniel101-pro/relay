import { NETWORKS } from './providers.js';
import { TransactionData, AddressInfo, ContractInfo, NetworkId } from './types.js';

/**
 * Explorer API wrapper for Etherscan/Basescan
 */
export class ExplorerAPI {
  private apiKeys: Map<number, string> = new Map();

  constructor() {
    // Load API keys from environment
    if (process.env.ETHERSCAN_API_KEY) {
      this.apiKeys.set(NetworkId.ETHEREUM_MAINNET, process.env.ETHERSCAN_API_KEY);
      this.apiKeys.set(NetworkId.ETHEREUM_SEPOLIA, process.env.ETHERSCAN_API_KEY);
    }
    if (process.env.BASESCAN_API_KEY) {
      this.apiKeys.set(NetworkId.BASE_MAINNET, process.env.BASESCAN_API_KEY);
      this.apiKeys.set(NetworkId.BASE_SEPOLIA, process.env.BASESCAN_API_KEY);
    }
  }

  /**
   * Get the explorer API URL for a chain
   */
  private getApiUrl(chainId: number): string {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return network.explorerApiUrl;
  }

  /**
   * Get the explorer URL for a chain
   */
  getExplorerUrl(chainId: number): string {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return network.explorerUrl;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    chainId: number,
    params: Record<string, string>
  ): Promise<T> {
    const apiUrl = this.getApiUrl(chainId);
    const apiKey = this.apiKeys.get(chainId);

    const url = new URL(apiUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    if (apiKey) {
      url.searchParams.append('apikey', apiKey);
    }

    const response = await fetch(url.toString());
    const data = await response.json() as { status: string; message: string; result: T };

    if (data.status === '0' && data.message !== 'No transactions found') {
      throw new Error(data.message || String(data.result));
    }

    return data.result;
  }

  /**
   * Get transaction details
   */
  async getTransaction(
    txHash: string,
    chainId: number = NetworkId.ETHEREUM_MAINNET
  ): Promise<TransactionData | null> {
    try {
      const tx = await this.request<{
        hash: string;
        blockNumber: string;
        timeStamp: string;
        from: string;
        to: string;
        value: string;
        gasUsed: string;
        gasPrice: string;
        isError: string;
        input: string;
        contractAddress: string;
        functionName: string;
      }>(chainId, {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
      });

      if (!tx) return null;

      // Get receipt for status
      const receipt = await this.request<{
        status: string;
        gasUsed: string;
      }>(chainId, {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash,
      });

      return {
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber, 16),
        timestamp: parseInt(tx.timeStamp, 16),
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: receipt?.gasUsed || tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: receipt?.status === '0x1' ? 'success' : 'failed',
        input: tx.input,
        contractAddress: tx.contractAddress || null,
        functionName: tx.functionName,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get address info
   */
  async getAddressInfo(
    address: string,
    chainId: number = NetworkId.ETHEREUM_MAINNET
  ): Promise<AddressInfo | null> {
    try {
      // Get balance
      const balance = await this.request<string>(chainId, {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
      });

      // Get transaction count
      const txList = await this.request<Array<{ hash: string }>>(chainId, {
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '1',
        sort: 'desc',
      });

      // Check if contract
      const code = await this.request<string>(chainId, {
        module: 'proxy',
        action: 'eth_getCode',
        address,
        tag: 'latest',
      });

      const isContract = code !== '0x';

      // Get contract info if applicable
      let contractName: string | undefined;
      let contractVerified = false;

      if (isContract) {
        try {
          const sourceCode = await this.request<Array<{ ContractName: string }>>(
            chainId,
            {
              module: 'contract',
              action: 'getsourcecode',
              address,
            }
          );
          if (sourceCode[0]?.ContractName) {
            contractName = sourceCode[0].ContractName;
            contractVerified = true;
          }
        } catch {
          // Contract not verified
        }
      }

      return {
        address,
        balance,
        transactionCount: Array.isArray(txList) ? txList.length : 0,
        isContract,
        contractName,
        contractVerified,
      };
    } catch (error) {
      console.error('Error fetching address info:', error);
      return null;
    }
  }

  /**
   * Get contract info
   */
  async getContractInfo(
    address: string,
    chainId: number = NetworkId.ETHEREUM_MAINNET
  ): Promise<ContractInfo | null> {
    try {
      const sourceCode = await this.request<
        Array<{
          ContractName: string;
          Symbol: string;
          ABI: string;
          SourceCode: string;
        }>
      >(chainId, {
        module: 'contract',
        action: 'getsourcecode',
        address,
      });

      if (!sourceCode[0]) return null;

      const contract = sourceCode[0];

      return {
        address,
        name: contract.ContractName || undefined,
        symbol: contract.Symbol || undefined,
        verified: !!contract.SourceCode,
        sourceCode: contract.SourceCode || undefined,
        abi: contract.ABI ? JSON.parse(contract.ABI) : undefined,
      };
    } catch (error) {
      console.error('Error fetching contract info:', error);
      return null;
    }
  }

  /**
   * Get recent transactions for an address
   */
  async getRecentTransactions(
    address: string,
    chainId: number = NetworkId.ETHEREUM_MAINNET,
    limit: number = 10
  ): Promise<TransactionData[]> {
    try {
      const txList = await this.request<
        Array<{
          hash: string;
          blockNumber: string;
          timeStamp: string;
          from: string;
          to: string;
          value: string;
          gasUsed: string;
          gasPrice: string;
          isError: string;
          input: string;
          contractAddress: string;
          functionName: string;
        }>
      >(chainId, {
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: limit.toString(),
        sort: 'desc',
      });

      if (!Array.isArray(txList)) return [];

      return txList.map((tx) => ({
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: parseInt(tx.timeStamp),
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.isError === '0' ? 'success' : 'failed',
        input: tx.input,
        contractAddress: tx.contractAddress || null,
        functionName: tx.functionName,
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction URL for sharing
   */
  getTransactionUrl(txHash: string, chainId: number = NetworkId.ETHEREUM_MAINNET): string {
    return `${this.getExplorerUrl(chainId)}/tx/${txHash}`;
  }

  /**
   * Get address URL for sharing
   */
  getAddressUrl(address: string, chainId: number = NetworkId.ETHEREUM_MAINNET): string {
    return `${this.getExplorerUrl(chainId)}/address/${address}`;
  }
}

// Default singleton
let defaultExplorer: ExplorerAPI | null = null;

export function getExplorerAPI(): ExplorerAPI {
  if (!defaultExplorer) {
    defaultExplorer = new ExplorerAPI();
  }
  return defaultExplorer;
}
