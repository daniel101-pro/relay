import { BaseSkill } from './base-skill.js';
import { IntentType, RiskLevel, } from '../types/index.js';
import { getExplorerAPI } from '../blockchain/explorer.js';
import { getBlockchainProvider } from '../blockchain/providers.js';
import { NetworkId } from '../blockchain/types.js';
import { formatEther, shortenAddress, } from '../utils/formatters.js';
/**
 * Verify Skill - Verifies safety and legitimacy of wallets, contracts, and claims
 *
 * "Can I trust this?"
 *
 * Takes: wallet address, contract address, or claim to verify
 * Returns: Trust assessment with on-chain evidence
 */
export class VerifySkill extends BaseSkill {
    name = 'verify';
    description = 'Verifies the safety and legitimacy of wallets and contracts';
    handledIntents = [IntentType.VERIFY];
    explorer = getExplorerAPI();
    provider = getBlockchainProvider();
    async validate(context) {
        const { entities } = context.intent;
        const hasTarget = entities.addresses.length > 0 ||
            entities.ensNames.length > 0 ||
            entities.transactionHashes.length > 0;
        if (!hasTarget) {
            return {
                valid: false,
                error: 'Please provide an address, ENS name, or transaction to verify.',
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
            // Priority: Address > ENS > Transaction
            if (entities.addresses.length > 0) {
                return await this.verifyAddress(entities.addresses[0], network);
            }
            if (entities.ensNames.length > 0) {
                const resolved = await this.provider.resolveENS(entities.ensNames[0]);
                if (resolved) {
                    return await this.verifyAddress(resolved, network, entities.ensNames[0]);
                }
                return this.error(`Could not resolve ENS name "${entities.ensNames[0]}".`);
            }
            if (entities.transactionHashes.length > 0) {
                return await this.verifyTransaction(entities.transactionHashes[0], network);
            }
            return this.error('Could not find anything to verify.');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.error(`Verification failed: ${message}`);
        }
    }
    /**
     * Verify an address (wallet or contract)
     */
    async verifyAddress(address, chainId, ensName) {
        const networkName = chainId === NetworkId.BASE_MAINNET ? 'Base' : 'Ethereum';
        // Fetch address info
        const addressInfo = await this.explorer.getAddressInfo(address, chainId);
        const recentTxs = await this.explorer.getRecentTransactions(address, chainId, 10);
        if (!addressInfo) {
            return this.error(`Could not fetch information for ${shortenAddress(address)}.`);
        }
        // Perform various checks
        const checks = [];
        // Check 1: Account age (based on transaction count)
        const ageCheck = this.checkAccountAge(recentTxs, addressInfo.transactionCount);
        checks.push(ageCheck);
        // Check 2: Transaction activity patterns
        const activityCheck = this.checkActivityPatterns(recentTxs, address);
        checks.push(activityCheck);
        // Check 3: Balance check
        const balanceCheck = this.checkBalance(addressInfo.balance);
        checks.push(balanceCheck);
        // If it's a contract, do additional checks
        if (addressInfo.isContract) {
            // Check 4: Contract verification status
            const verificationCheck = this.checkContractVerification(addressInfo);
            checks.push(verificationCheck);
            // Check 5: Contract info
            const contractInfo = await this.explorer.getContractInfo(address, chainId);
            if (contractInfo) {
                const auditCheck = this.checkContractSecurity(contractInfo);
                checks.push(auditCheck);
            }
        }
        // Calculate overall risk
        const overallRisk = this.calculateOverallRisk(checks);
        const verdict = this.generateVerdict(overallRisk, addressInfo.isContract);
        const explorerUrl = this.explorer.getAddressUrl(address, chainId);
        return this.success({
            type: 'address_verification',
            address,
            ensName: ensName || null,
            network: networkName,
            verdict: verdict.text,
            verdictEmoji: verdict.emoji,
            isContract: addressInfo.isContract,
            contractName: addressInfo.contractName || null,
            checks: checks.map(c => ({
                name: c.name,
                status: c.passed ? 'passed' : 'warning',
                message: c.message,
                severity: c.severity,
            })),
            summary: this.generateSummary(checks, addressInfo, verdict),
            recommendations: this.generateRecommendations(checks, overallRisk, addressInfo.isContract),
            explorerUrl,
            details: {
                balance: formatEther(BigInt(addressInfo.balance)) + ' ETH',
                transactionCount: addressInfo.transactionCount,
                contractVerified: addressInfo.contractVerified || false,
            },
        }, {
            riskLevel: overallRisk,
            confidence: this.calculateConfidence(checks),
            warnings: checks.filter(c => !c.passed).map(c => c.message),
        });
    }
    /**
     * Verify a transaction
     */
    async verifyTransaction(txHash, chainId) {
        const txData = await this.explorer.getTransaction(txHash, chainId);
        if (!txData) {
            return this.error(`Transaction ${shortenAddress(txHash)} not found.`);
        }
        const networkName = chainId === NetworkId.BASE_MAINNET ? 'Base' : 'Ethereum';
        const checks = [];
        // Check 1: Transaction status
        checks.push({
            name: 'Transaction Status',
            passed: txData.status === 'success',
            message: txData.status === 'success'
                ? 'Transaction completed successfully'
                : 'Transaction failed',
            severity: txData.status === 'success' ? 'low' : 'high',
        });
        // Check 2: Verify recipient
        if (txData.to) {
            const recipientInfo = await this.explorer.getAddressInfo(txData.to, chainId);
            if (recipientInfo) {
                checks.push({
                    name: 'Recipient Check',
                    passed: recipientInfo.transactionCount > 10,
                    message: recipientInfo.transactionCount > 10
                        ? `Recipient has ${recipientInfo.transactionCount} transactions (established)`
                        : `Recipient has only ${recipientInfo.transactionCount} transactions (new address)`,
                    severity: recipientInfo.transactionCount > 10 ? 'low' : 'medium',
                });
                if (recipientInfo.isContract) {
                    checks.push({
                        name: 'Contract Verification',
                        passed: recipientInfo.contractVerified || false,
                        message: recipientInfo.contractVerified
                            ? 'Recipient contract is verified on explorer'
                            : 'Recipient contract is NOT verified - source code unknown',
                        severity: recipientInfo.contractVerified ? 'low' : 'high',
                    });
                }
            }
        }
        // Check 3: Value check
        const valueEth = parseFloat(formatEther(BigInt(txData.value)));
        if (valueEth > 1) {
            checks.push({
                name: 'Value Check',
                passed: valueEth < 10,
                message: valueEth >= 10
                    ? `High value transaction: ${valueEth.toFixed(4)} ETH`
                    : `Moderate value: ${valueEth.toFixed(4)} ETH`,
                severity: valueEth >= 10 ? 'medium' : 'low',
            });
        }
        // Check 4: Function call analysis
        if (txData.input && txData.input !== '0x') {
            const functionCheck = this.analyzeFunctionCall(txData.input);
            checks.push(functionCheck);
        }
        const overallRisk = this.calculateOverallRisk(checks);
        const verdict = this.generateVerdict(overallRisk, false);
        return this.success({
            type: 'transaction_verification',
            hash: txHash,
            network: networkName,
            verdict: verdict.text,
            verdictEmoji: verdict.emoji,
            checks: checks.map(c => ({
                name: c.name,
                status: c.passed ? 'passed' : 'warning',
                message: c.message,
                severity: c.severity,
            })),
            summary: `Transaction ${txData.status === 'success' ? 'completed' : 'failed'} on ${networkName}. ${checks.filter(c => !c.passed).length} potential concerns found.`,
            recommendations: this.generateRecommendations(checks, overallRisk, false),
            explorerUrl: this.explorer.getTransactionUrl(txHash, chainId),
            details: {
                from: txData.from,
                to: txData.to || 'Contract Creation',
                value: formatEther(BigInt(txData.value)) + ' ETH',
                status: txData.status,
            },
        }, {
            riskLevel: overallRisk,
            confidence: this.calculateConfidence(checks),
            warnings: checks.filter(c => !c.passed).map(c => c.message),
        });
    }
    /**
     * Check account age based on transaction history
     */
    checkAccountAge(recentTxs, txCount) {
        if (txCount === 0) {
            return {
                name: 'Account Age',
                passed: false,
                message: 'This is a brand new address with no transaction history',
                severity: 'high',
            };
        }
        if (recentTxs.length > 0) {
            // Find oldest transaction
            const oldestTx = recentTxs.reduce((oldest, tx) => tx.timestamp < oldest.timestamp ? tx : oldest, recentTxs[0]);
            const ageInDays = (Date.now() / 1000 - oldestTx.timestamp) / 86400;
            if (ageInDays < 7) {
                return {
                    name: 'Account Age',
                    passed: false,
                    message: `Account is only ${Math.floor(ageInDays)} days old`,
                    severity: 'high',
                };
            }
            else if (ageInDays < 30) {
                return {
                    name: 'Account Age',
                    passed: true,
                    message: `Account is ${Math.floor(ageInDays)} days old`,
                    severity: 'medium',
                };
            }
            else {
                return {
                    name: 'Account Age',
                    passed: true,
                    message: `Account is ${Math.floor(ageInDays)} days old (established)`,
                    severity: 'low',
                };
            }
        }
        return {
            name: 'Account Age',
            passed: true,
            message: `Account has ${txCount} transactions`,
            severity: 'low',
        };
    }
    /**
     * Check activity patterns for suspicious behavior
     */
    checkActivityPatterns(recentTxs, address) {
        if (recentTxs.length === 0) {
            return {
                name: 'Activity Pattern',
                passed: false,
                message: 'No transaction history to analyze',
                severity: 'medium',
            };
        }
        // Check for rapid transactions (potential bot/drainer)
        const txTimestamps = recentTxs.map(tx => tx.timestamp).sort();
        let rapidTxCount = 0;
        for (let i = 1; i < txTimestamps.length; i++) {
            if (txTimestamps[i] - txTimestamps[i - 1] < 60) {
                rapidTxCount++;
            }
        }
        if (rapidTxCount > 3) {
            return {
                name: 'Activity Pattern',
                passed: false,
                message: 'Unusually rapid transaction pattern detected (possible bot)',
                severity: 'high',
            };
        }
        // Check for primarily outgoing transactions (potential drainer)
        const outgoing = recentTxs.filter(tx => tx.from.toLowerCase() === address.toLowerCase());
        const outgoingRatio = outgoing.length / recentTxs.length;
        if (outgoingRatio > 0.9 && recentTxs.length > 5) {
            return {
                name: 'Activity Pattern',
                passed: false,
                message: 'Address primarily sends funds out (unusual pattern)',
                severity: 'medium',
            };
        }
        return {
            name: 'Activity Pattern',
            passed: true,
            message: 'Normal transaction patterns observed',
            severity: 'low',
        };
    }
    /**
     * Check balance
     */
    checkBalance(balanceWei) {
        const balanceEth = parseFloat(formatEther(BigInt(balanceWei)));
        if (balanceEth === 0) {
            return {
                name: 'Balance Check',
                passed: true,
                message: 'Zero balance (funds may have been moved)',
                severity: 'low',
            };
        }
        if (balanceEth > 100) {
            return {
                name: 'Balance Check',
                passed: true,
                message: `Significant balance: ${balanceEth.toFixed(2)} ETH`,
                severity: 'low',
            };
        }
        return {
            name: 'Balance Check',
            passed: true,
            message: `Current balance: ${balanceEth.toFixed(4)} ETH`,
            severity: 'low',
        };
    }
    /**
     * Check contract verification status
     */
    checkContractVerification(addressInfo) {
        if (!addressInfo.isContract) {
            return {
                name: 'Contract Verification',
                passed: true,
                message: 'Not a contract (regular wallet)',
                severity: 'low',
            };
        }
        if (addressInfo.contractVerified) {
            return {
                name: 'Contract Verification',
                passed: true,
                message: addressInfo.contractName
                    ? `Verified contract: ${addressInfo.contractName}`
                    : 'Contract source code is verified',
                severity: 'low',
            };
        }
        return {
            name: 'Contract Verification',
            passed: false,
            message: 'Contract source code is NOT verified - cannot audit',
            severity: 'high',
        };
    }
    /**
     * Check contract security indicators
     */
    checkContractSecurity(contractInfo) {
        if (!contractInfo.verified || !contractInfo.sourceCode) {
            return {
                name: 'Security Analysis',
                passed: false,
                message: 'Cannot analyze - source code not available',
                severity: 'high',
            };
        }
        // Basic pattern checks on source code
        const warnings = [];
        if (contractInfo.sourceCode.includes('selfdestruct')) {
            warnings.push('Contains selfdestruct function');
        }
        if (contractInfo.sourceCode.includes('delegatecall')) {
            warnings.push('Uses delegatecall');
        }
        if (contractInfo.sourceCode.includes('onlyOwner') &&
            !contractInfo.sourceCode.includes('timelock')) {
            warnings.push('Owner-controlled without timelock');
        }
        if (warnings.length > 0) {
            return {
                name: 'Security Analysis',
                passed: false,
                message: `Potential concerns: ${warnings.join(', ')}`,
                severity: 'medium',
            };
        }
        return {
            name: 'Security Analysis',
            passed: true,
            message: 'No obvious security concerns in source code',
            severity: 'low',
        };
    }
    /**
     * Analyze function call for suspicious patterns
     */
    analyzeFunctionCall(input) {
        const selector = input.slice(0, 10);
        if (selector === '0x095ea7b3') {
            return {
                name: 'Function Analysis',
                passed: true,
                message: 'Token approval function - grants spending permission',
                severity: 'medium',
            };
        }
        if (selector === '0xa22cb465') {
            return {
                name: 'Function Analysis',
                passed: false,
                message: 'SetApprovalForAll - grants full NFT collection access',
                severity: 'high',
            };
        }
        return {
            name: 'Function Analysis',
            passed: true,
            message: 'Standard contract interaction',
            severity: 'low',
        };
    }
    /**
     * Calculate overall risk from checks
     */
    calculateOverallRisk(checks) {
        const highSeverityFails = checks.filter(c => !c.passed && c.severity === 'high').length;
        const mediumSeverityFails = checks.filter(c => !c.passed && c.severity === 'medium').length;
        if (highSeverityFails >= 2)
            return RiskLevel.CRITICAL;
        if (highSeverityFails >= 1)
            return RiskLevel.HIGH;
        if (mediumSeverityFails >= 2)
            return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
    /**
     * Calculate confidence score
     */
    calculateConfidence(checks) {
        const passedRatio = checks.filter(c => c.passed).length / checks.length;
        return 0.6 + (passedRatio * 0.35);
    }
    /**
     * Generate verdict text
     */
    generateVerdict(risk, isContract) {
        const type = isContract ? 'contract' : 'address';
        switch (risk) {
            case RiskLevel.LOW:
                return { text: `This ${type} appears safe`, emoji: '✅' };
            case RiskLevel.MEDIUM:
                return { text: `This ${type} has some concerns`, emoji: '⚠️' };
            case RiskLevel.HIGH:
                return { text: `This ${type} shows high risk indicators`, emoji: '🚨' };
            case RiskLevel.CRITICAL:
                return { text: `This ${type} is likely dangerous`, emoji: '🛑' };
        }
    }
    /**
     * Generate summary text
     */
    generateSummary(checks, addressInfo, verdict) {
        const passedCount = checks.filter(c => c.passed).length;
        const type = addressInfo.isContract
            ? (addressInfo.contractName || 'smart contract')
            : 'wallet';
        return `${verdict.text}. Passed ${passedCount}/${checks.length} security checks. This ${type} has ${addressInfo.transactionCount} transactions on record.`;
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(checks, risk, isContract) {
        const recommendations = [];
        if (risk === RiskLevel.CRITICAL || risk === RiskLevel.HIGH) {
            recommendations.push('⚠️ Exercise extreme caution before interacting');
            recommendations.push('Do not send significant funds to this address');
            recommendations.push('Verify through official channels before proceeding');
        }
        const failedChecks = checks.filter(c => !c.passed);
        for (const check of failedChecks) {
            if (check.name === 'Contract Verification' && !check.passed) {
                recommendations.push('Only interact with verified contracts when possible');
            }
            if (check.name === 'Account Age' && !check.passed) {
                recommendations.push('New addresses carry higher risk - proceed carefully');
            }
            if (check.name === 'Activity Pattern' && !check.passed) {
                recommendations.push('Unusual activity patterns detected - investigate further');
            }
        }
        if (recommendations.length === 0) {
            if (isContract) {
                recommendations.push('Contract appears legitimate, but always DYOR');
            }
            else {
                recommendations.push('Address appears safe for transactions');
            }
            recommendations.push('Start with small amounts when interacting with new addresses');
        }
        return recommendations;
    }
}
//# sourceMappingURL=verify.skill.js.map