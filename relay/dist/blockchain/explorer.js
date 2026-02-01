import { NETWORKS } from './providers.js';
import { NetworkId } from './types.js';
/**
 * Explorer API wrapper for Etherscan/Basescan
 */
export class ExplorerAPI {
    apiKeys = new Map();
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
    getApiUrl(chainId) {
        const network = NETWORKS[chainId];
        if (!network) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }
        return network.explorerApiUrl;
    }
    /**
     * Get the explorer URL for a chain
     */
    getExplorerUrl(chainId) {
        const network = NETWORKS[chainId];
        if (!network) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }
        return network.explorerUrl;
    }
    /**
     * Make an API request
     */
    async request(chainId, params) {
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
        const data = await response.json();
        if (data.status === '0' && data.message !== 'No transactions found') {
            throw new Error(data.message || String(data.result));
        }
        return data.result;
    }
    /**
     * Get transaction details
     */
    async getTransaction(txHash, chainId = NetworkId.ETHEREUM_MAINNET) {
        try {
            const tx = await this.request(chainId, {
                module: 'proxy',
                action: 'eth_getTransactionByHash',
                txhash: txHash,
            });
            if (!tx)
                return null;
            // Get receipt for status
            const receipt = await this.request(chainId, {
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
        }
        catch (error) {
            console.error('Error fetching transaction:', error);
            return null;
        }
    }
    /**
     * Get address info
     */
    async getAddressInfo(address, chainId = NetworkId.ETHEREUM_MAINNET) {
        try {
            // Get balance
            const balance = await this.request(chainId, {
                module: 'account',
                action: 'balance',
                address,
                tag: 'latest',
            });
            // Get transaction count
            const txList = await this.request(chainId, {
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
            const code = await this.request(chainId, {
                module: 'proxy',
                action: 'eth_getCode',
                address,
                tag: 'latest',
            });
            const isContract = code !== '0x';
            // Get contract info if applicable
            let contractName;
            let contractVerified = false;
            if (isContract) {
                try {
                    const sourceCode = await this.request(chainId, {
                        module: 'contract',
                        action: 'getsourcecode',
                        address,
                    });
                    if (sourceCode[0]?.ContractName) {
                        contractName = sourceCode[0].ContractName;
                        contractVerified = true;
                    }
                }
                catch {
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
        }
        catch (error) {
            console.error('Error fetching address info:', error);
            return null;
        }
    }
    /**
     * Get contract info
     */
    async getContractInfo(address, chainId = NetworkId.ETHEREUM_MAINNET) {
        try {
            const sourceCode = await this.request(chainId, {
                module: 'contract',
                action: 'getsourcecode',
                address,
            });
            if (!sourceCode[0])
                return null;
            const contract = sourceCode[0];
            return {
                address,
                name: contract.ContractName || undefined,
                symbol: contract.Symbol || undefined,
                verified: !!contract.SourceCode,
                sourceCode: contract.SourceCode || undefined,
                abi: contract.ABI ? JSON.parse(contract.ABI) : undefined,
            };
        }
        catch (error) {
            console.error('Error fetching contract info:', error);
            return null;
        }
    }
    /**
     * Get recent transactions for an address
     */
    async getRecentTransactions(address, chainId = NetworkId.ETHEREUM_MAINNET, limit = 10) {
        try {
            const txList = await this.request(chainId, {
                module: 'account',
                action: 'txlist',
                address,
                startblock: '0',
                endblock: '99999999',
                page: '1',
                offset: limit.toString(),
                sort: 'desc',
            });
            if (!Array.isArray(txList))
                return [];
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
        }
        catch (error) {
            console.error('Error fetching recent transactions:', error);
            return [];
        }
    }
    /**
     * Get transaction URL for sharing
     */
    getTransactionUrl(txHash, chainId = NetworkId.ETHEREUM_MAINNET) {
        return `${this.getExplorerUrl(chainId)}/tx/${txHash}`;
    }
    /**
     * Get address URL for sharing
     */
    getAddressUrl(address, chainId = NetworkId.ETHEREUM_MAINNET) {
        return `${this.getExplorerUrl(chainId)}/address/${address}`;
    }
}
// Default singleton
let defaultExplorer = null;
export function getExplorerAPI() {
    if (!defaultExplorer) {
        defaultExplorer = new ExplorerAPI();
    }
    return defaultExplorer;
}
//# sourceMappingURL=explorer.js.map