import { BaseSkill } from './base-skill.js';
import { IntentType, RiskLevel, } from '../types/index.js';
import { getExplorerAPI } from '../blockchain/explorer.js';
import { getBlockchainProvider } from '../blockchain/providers.js';
import { NetworkId } from '../blockchain/types.js';
import { formatEther, formatGwei, formatTimestamp, formatRelativeTime, shortenAddress, formatCurrency, } from '../utils/formatters.js';
/**
 * Explain Skill - Explains transactions, addresses, and blockchain activity
 *
 * "What just happened?"
 *
 * Takes: tx hash, wallet address, or blockchain query
 * Returns: Plain English explanation with risk assessment
 */
export class ExplainSkill extends BaseSkill {
    name = 'explain';
    description = 'Explains blockchain transactions and addresses in plain English';
    handledIntents = [IntentType.EXPLAIN];
    explorer = getExplorerAPI();
    provider = getBlockchainProvider();
    async validate(context) {
        const { entities } = context.intent;
        // Need at least one entity to explain
        const hasEntity = entities.addresses.length > 0 ||
            entities.transactionHashes.length > 0 ||
            entities.ensNames.length > 0;
        if (!hasEntity) {
            return {
                valid: false,
                error: 'Please provide a transaction hash, wallet address, or ENS name to explain.',
            };
        }
        return { valid: true };
    }
    async execute(context) {
        const { entities } = context.intent;
        const network = context.intent.suggestedNetwork === 'base'
            ? NetworkId.BASE_MAINNET
            : NetworkId.ETHEREUM_MAINNET;
        try {
            // Priority: Transaction hash > Address > ENS
            if (entities.transactionHashes.length > 0) {
                return await this.explainTransaction(entities.transactionHashes[0], network);
            }
            if (entities.addresses.length > 0) {
                return await this.explainAddress(entities.addresses[0], network);
            }
            if (entities.ensNames.length > 0) {
                return await this.explainENS(entities.ensNames[0]);
            }
            return this.error('Could not find anything to explain in your message.');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.error(`Failed to fetch blockchain data: ${message}`);
        }
    }
    /**
     * Explain a transaction
     */
    async explainTransaction(txHash, chainId) {
        // Fetch transaction data from explorer
        const txData = await this.explorer.getTransaction(txHash, chainId);
        if (!txData) {
            // Try the other network
            const altChainId = chainId === NetworkId.ETHEREUM_MAINNET
                ? NetworkId.BASE_MAINNET
                : NetworkId.ETHEREUM_MAINNET;
            const altTxData = await this.explorer.getTransaction(txHash, altChainId);
            if (!altTxData) {
                return this.error(`Transaction ${shortenAddress(txHash)} not found on Ethereum or Base.`);
            }
            return this.formatTransactionResult(altTxData, altChainId);
        }
        return this.formatTransactionResult(txData, chainId);
    }
    /**
     * Format transaction data into a result
     */
    formatTransactionResult(txData, chainId) {
        const networkName = chainId === NetworkId.BASE_MAINNET ? 'Base' : 'Ethereum';
        const explorerUrl = this.explorer.getTransactionUrl(txData.hash, chainId);
        // Parse value
        const valueWei = BigInt(txData.value);
        const valueEth = formatEther(valueWei);
        const valueFloat = parseFloat(valueEth);
        // Estimate USD value (mock ETH price for demo)
        const ethPrice = 2500;
        const valueUsd = valueFloat * ethPrice;
        // Calculate gas fee
        const gasUsed = BigInt(txData.gasUsed);
        const gasPrice = BigInt(txData.gasPrice);
        const gasFeeWei = gasUsed * gasPrice;
        const gasFeeEth = formatEther(gasFeeWei);
        // Determine transaction type
        const txType = this.determineTransactionType(txData);
        // Assess risk
        const riskAssessment = this.assessTransactionRisk(txData, valueFloat);
        // Generate explanation
        const explanation = this.generateTransactionExplanation(txData, txType, valueEth, networkName);
        return this.success({
            type: 'transaction',
            hash: txData.hash,
            network: networkName,
            transactionType: txType,
            explanation,
            details: {
                from: txData.from,
                to: txData.to || 'Contract Creation',
                value: `${valueEth} ETH`,
                valueUsd: formatCurrency(valueUsd, 'USD'),
                gasUsed: txData.gasUsed,
                gasPrice: formatGwei(gasPrice),
                gasFee: `${gasFeeEth} ETH`,
                status: txData.status,
                timestamp: formatTimestamp(txData.timestamp),
                relativeTime: formatRelativeTime(txData.timestamp),
                blockNumber: txData.blockNumber,
                functionName: txData.functionName || null,
            },
            summary: explanation,
            explorerUrl,
            verification: {
                confirmed: txData.status === 'success',
                blockNumber: txData.blockNumber,
            },
        }, {
            riskLevel: riskAssessment.level,
            confidence: 0.95,
            warnings: riskAssessment.warnings,
        });
    }
    /**
     * Determine the type of transaction
     */
    determineTransactionType(txData) {
        // Contract creation
        if (!txData.to) {
            return 'contract_creation';
        }
        // Simple ETH transfer
        if (!txData.input || txData.input === '0x' || txData.input === '0x0') {
            return 'eth_transfer';
        }
        // Token transfer (ERC20)
        if (txData.input?.startsWith('0xa9059cbb')) {
            return 'token_transfer';
        }
        // Token approval
        if (txData.input?.startsWith('0x095ea7b3')) {
            return 'token_approval';
        }
        // Swap (common DEX signatures)
        if (txData.input?.startsWith('0x38ed1739') || // swapExactTokensForTokens
            txData.input?.startsWith('0x7ff36ab5') || // swapExactETHForTokens
            txData.input?.startsWith('0x18cbafe5') // swapExactTokensForETH
        ) {
            return 'swap';
        }
        // NFT transfer
        if (txData.input?.startsWith('0x23b872dd') || // transferFrom
            txData.input?.startsWith('0x42842e0e') // safeTransferFrom
        ) {
            return 'nft_transfer';
        }
        // Generic contract interaction
        return 'contract_interaction';
    }
    /**
     * Generate human-readable explanation
     */
    generateTransactionExplanation(txData, txType, valueEth, network) {
        const fromShort = shortenAddress(txData.from);
        const toShort = txData.to ? shortenAddress(txData.to) : 'new contract';
        const statusText = txData.status === 'success' ? 'successfully' : 'but failed';
        const value = parseFloat(valueEth);
        const explanations = {
            eth_transfer: `This transaction ${statusText} sent ${valueEth} ETH from ${fromShort} to ${toShort} on ${network}.`,
            token_transfer: `This transaction ${statusText} transferred tokens from ${fromShort} to ${toShort} on ${network}.${value > 0 ? ` It also included ${valueEth} ETH.` : ''}`,
            token_approval: `This transaction ${statusText} approved a contract to spend tokens on behalf of ${fromShort} on ${network}. This is typically required before swapping or staking tokens.`,
            swap: `This transaction ${statusText} performed a token swap on ${network}. The user at ${fromShort} exchanged tokens through a decentralized exchange.`,
            nft_transfer: `This transaction ${statusText} transferred an NFT from ${fromShort} to ${toShort} on ${network}.`,
            contract_creation: `This transaction ${statusText} deployed a new smart contract on ${network}. The deployer was ${fromShort}.`,
            contract_interaction: `This transaction ${statusText} interacted with a smart contract at ${toShort} on ${network}.${value > 0 ? ` It included ${valueEth} ETH.` : ''}`,
        };
        return explanations[txType] || `This is a ${network} transaction from ${fromShort} to ${toShort}.`;
    }
    /**
     * Assess transaction risk
     */
    assessTransactionRisk(txData, valueEth) {
        const warnings = [];
        let riskScore = 0;
        // Failed transaction
        if (txData.status !== 'success') {
            warnings.push('This transaction failed');
            riskScore += 1;
        }
        // High value transaction
        if (valueEth > 10) {
            warnings.push('High value transaction (>10 ETH)');
            riskScore += 1;
        }
        // Contract creation
        if (!txData.to) {
            warnings.push('This created a new contract');
        }
        if (riskScore >= 2)
            return { level: RiskLevel.MEDIUM, warnings };
        return { level: RiskLevel.LOW, warnings };
    }
    /**
     * Explain an address
     */
    async explainAddress(address, chainId) {
        // Fetch address info
        const addressInfo = await this.explorer.getAddressInfo(address, chainId);
        const recentTxs = await this.explorer.getRecentTransactions(address, chainId, 5);
        if (!addressInfo) {
            return this.error(`Could not fetch information for address ${shortenAddress(address)}.`);
        }
        const networkName = chainId === NetworkId.BASE_MAINNET ? 'Base' : 'Ethereum';
        const explorerUrl = this.explorer.getAddressUrl(address, chainId);
        // Parse balance
        const balanceWei = BigInt(addressInfo.balance);
        const balanceEth = formatEther(balanceWei);
        const balanceFloat = parseFloat(balanceEth);
        const ethPrice = 2500;
        const balanceUsd = balanceFloat * ethPrice;
        // Determine address type and activity level
        const activityLevel = this.assessActivityLevel(addressInfo.transactionCount);
        const addressType = addressInfo.isContract ? 'Smart Contract' : 'Wallet (EOA)';
        // Generate explanation
        let explanation = `This is a ${addressType.toLowerCase()} on ${networkName}`;
        if (addressInfo.isContract && addressInfo.contractName) {
            explanation += ` named "${addressInfo.contractName}"`;
        }
        explanation += ` with ${activityLevel} activity.`;
        if (!addressInfo.isContract) {
            explanation += ` Current balance: ${balanceEth} ETH (${formatCurrency(balanceUsd, 'USD')}).`;
        }
        // Assess risk
        const riskAssessment = this.assessAddressRisk(addressInfo, recentTxs);
        return this.success({
            type: 'address',
            address,
            network: networkName,
            addressType,
            explanation,
            details: {
                balance: `${balanceEth} ETH`,
                balanceUsd: formatCurrency(balanceUsd, 'USD'),
                transactionCount: addressInfo.transactionCount,
                isContract: addressInfo.isContract,
                contractName: addressInfo.contractName || null,
                contractVerified: addressInfo.contractVerified || false,
                activityLevel,
            },
            recentTransactions: recentTxs.slice(0, 3).map(tx => ({
                hash: tx.hash,
                type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
                value: formatEther(BigInt(tx.value)) + ' ETH',
                timestamp: formatRelativeTime(tx.timestamp),
            })),
            summary: explanation,
            explorerUrl,
        }, {
            riskLevel: riskAssessment.level,
            confidence: 0.9,
            warnings: riskAssessment.warnings,
        });
    }
    /**
     * Assess activity level based on transaction count
     */
    assessActivityLevel(txCount) {
        if (txCount === 0)
            return 'no';
        if (txCount < 10)
            return 'low';
        if (txCount < 100)
            return 'moderate';
        if (txCount < 1000)
            return 'high';
        return 'very high';
    }
    /**
     * Assess address risk
     */
    assessAddressRisk(addressInfo, _recentTxs) {
        const warnings = [];
        let riskScore = 0;
        // Unverified contract
        if (addressInfo.isContract && !addressInfo.contractVerified) {
            warnings.push('Contract source code is not verified');
            riskScore += 2;
        }
        // New address with no history
        if (addressInfo.transactionCount === 0) {
            warnings.push('This address has no transaction history');
            riskScore += 1;
        }
        if (riskScore >= 2)
            return { level: RiskLevel.MEDIUM, warnings };
        return { level: RiskLevel.LOW, warnings };
    }
    /**
     * Explain an ENS name
     */
    async explainENS(ensName) {
        try {
            // Resolve ENS to address
            const resolvedAddress = await this.provider.resolveENS(ensName);
            if (!resolvedAddress) {
                return this.error(`ENS name "${ensName}" could not be resolved. It may not be registered or may have expired.`);
            }
            // Get info about the resolved address
            const addressInfo = await this.explorer.getAddressInfo(resolvedAddress, NetworkId.ETHEREUM_MAINNET);
            const explorerUrl = this.explorer.getAddressUrl(resolvedAddress, NetworkId.ETHEREUM_MAINNET);
            // Parse balance if available
            let balanceInfo = '';
            if (addressInfo) {
                const balanceEth = formatEther(BigInt(addressInfo.balance));
                const ethPrice = 2500;
                const balanceUsd = parseFloat(balanceEth) * ethPrice;
                balanceInfo = ` The wallet currently holds ${balanceEth} ETH (${formatCurrency(balanceUsd, 'USD')}).`;
            }
            const explanation = `"${ensName}" is an ENS (Ethereum Name Service) domain that resolves to ${shortenAddress(resolvedAddress)}.${balanceInfo} ENS names work like domain names for Ethereum addresses, making them easier to remember and share.`;
            return this.success({
                type: 'ens',
                name: ensName,
                resolvedAddress,
                explanation,
                details: {
                    ensName,
                    resolvedAddress,
                    isRegistered: true,
                    network: 'Ethereum',
                    balance: addressInfo ? formatEther(BigInt(addressInfo.balance)) + ' ETH' : null,
                },
                summary: explanation,
                explorerUrl,
            }, {
                riskLevel: RiskLevel.LOW,
                confidence: 0.95,
            });
        }
        catch (error) {
            return this.error(`Failed to resolve ENS name "${ensName}".`);
        }
    }
}
//# sourceMappingURL=explain.skill.js.map