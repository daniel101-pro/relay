import { ethers } from 'ethers';
/**
 * Format wei to ETH
 */
export function formatEther(wei) {
    return ethers.formatEther(wei);
}
/**
 * Parse ETH to wei
 */
export function parseEther(eth) {
    return ethers.parseEther(eth);
}
/**
 * Format units with decimals
 */
export function formatUnits(value, decimals = 18) {
    return ethers.formatUnits(value, decimals);
}
/**
 * Parse units to bigint
 */
export function parseUnits(value, decimals = 18) {
    return ethers.parseUnits(value, decimals);
}
/**
 * Shorten address for display
 */
export function shortenAddress(address, chars = 4) {
    if (!address)
        return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
/**
 * Shorten transaction hash for display
 */
export function shortenTxHash(hash, chars = 6) {
    if (!hash)
        return '';
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}
/**
 * Format large numbers with commas
 */
export function formatNumber(num) {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('en-US');
}
/**
 * Format currency with symbol
 */
export function formatCurrency(amount, currency = 'USD') {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbols = {
        USD: '$',
        GBP: '£',
        EUR: '€',
        ETH: 'Ξ',
    };
    const symbol = symbols[currency.toUpperCase()] || '';
    const formatted = n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: currency.toUpperCase() === 'ETH' ? 6 : 2,
    });
    return `${symbol}${formatted}`;
}
/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp, options) {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options || defaultOptions);
}
/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp) {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) {
        return 'just now';
    }
    else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    }
    else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    else {
        return formatTimestamp(date);
    }
}
/**
 * Format gas in gwei
 */
export function formatGwei(wei) {
    const value = typeof wei === 'string' ? BigInt(wei) : wei;
    const gwei = Number(value) / 1e9;
    return `${gwei.toFixed(2)} gwei`;
}
/**
 * Format gas fee in ETH and USD
 */
export function formatGasFee(gasUsed, gasPrice, ethPrice = 2500) {
    const used = typeof gasUsed === 'string' ? BigInt(gasUsed) : gasUsed;
    const price = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
    const feeWei = used * price;
    const feeEth = parseFloat(formatEther(feeWei));
    const feeUsd = feeEth * ethPrice;
    return {
        eth: `${feeEth.toFixed(6)} ETH`,
        usd: formatCurrency(feeUsd, 'USD'),
    };
}
/**
 * Format risk level with emoji
 */
export function formatRiskLevel(level) {
    const levels = {
        low: '✅ Low Risk',
        medium: '⚠️ Medium Risk',
        high: '🚨 High Risk',
        critical: '🛑 Critical Risk',
    };
    return levels[level.toLowerCase()] || level;
}
/**
 * Format transaction status
 */
export function formatTxStatus(status) {
    const statuses = {
        success: '✅ Confirmed',
        failed: '❌ Failed',
        pending: '⏳ Pending',
    };
    return statuses[status.toLowerCase()] || status;
}
/**
 * Create a clean multiline string for chat
 */
export function createChatMessage(lines) {
    return lines.filter(Boolean).join('\n');
}
//# sourceMappingURL=formatters.js.map