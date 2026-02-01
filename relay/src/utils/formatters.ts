import { ethers } from 'ethers';

/**
 * Format wei to ETH
 */
export function formatEther(wei: bigint | string): string {
  return ethers.formatEther(wei);
}

/**
 * Parse ETH to wei
 */
export function parseEther(eth: string): bigint {
  return ethers.parseEther(eth);
}

/**
 * Format units with decimals
 */
export function formatUnits(value: bigint | string, decimals: number = 18): string {
  return ethers.formatUnits(value, decimals);
}

/**
 * Parse units to bigint
 */
export function parseUnits(value: string, decimals: number = 18): bigint {
  return ethers.parseUnits(value, decimals);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Shorten transaction hash for display
 */
export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('en-US');
}

/**
 * Format currency with symbol
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD'
): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;

  const symbols: Record<string, string> = {
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
export function formatTimestamp(
  timestamp: number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;

  const defaultOptions: Intl.DateTimeFormatOptions = {
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
export function formatRelativeTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return formatTimestamp(date);
  }
}

/**
 * Format gas in gwei
 */
export function formatGwei(wei: bigint | string): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const gwei = Number(value) / 1e9;
  return `${gwei.toFixed(2)} gwei`;
}

/**
 * Format gas fee in ETH and USD
 */
export function formatGasFee(
  gasUsed: bigint | string,
  gasPrice: bigint | string,
  ethPrice: number = 2500
): { eth: string; usd: string } {
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
export function formatRiskLevel(level: string): string {
  const levels: Record<string, string> = {
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
export function formatTxStatus(status: string): string {
  const statuses: Record<string, string> = {
    success: '✅ Confirmed',
    failed: '❌ Failed',
    pending: '⏳ Pending',
  };
  return statuses[status.toLowerCase()] || status;
}

/**
 * Create a clean multiline string for chat
 */
export function createChatMessage(lines: string[]): string {
  return lines.filter(Boolean).join('\n');
}
