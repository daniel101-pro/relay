/**
 * Format wei to ETH
 */
export declare function formatEther(wei: bigint | string): string;
/**
 * Parse ETH to wei
 */
export declare function parseEther(eth: string): bigint;
/**
 * Format units with decimals
 */
export declare function formatUnits(value: bigint | string, decimals?: number): string;
/**
 * Parse units to bigint
 */
export declare function parseUnits(value: string, decimals?: number): bigint;
/**
 * Shorten address for display
 */
export declare function shortenAddress(address: string, chars?: number): string;
/**
 * Shorten transaction hash for display
 */
export declare function shortenTxHash(hash: string, chars?: number): string;
/**
 * Format large numbers with commas
 */
export declare function formatNumber(num: number | string): string;
/**
 * Format currency with symbol
 */
export declare function formatCurrency(amount: number | string, currency?: string): string;
/**
 * Format timestamp to readable date
 */
export declare function formatTimestamp(timestamp: number | Date, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(timestamp: number | Date): string;
/**
 * Format gas in gwei
 */
export declare function formatGwei(wei: bigint | string): string;
/**
 * Format gas fee in ETH and USD
 */
export declare function formatGasFee(gasUsed: bigint | string, gasPrice: bigint | string, ethPrice?: number): {
    eth: string;
    usd: string;
};
/**
 * Format risk level with emoji
 */
export declare function formatRiskLevel(level: string): string;
/**
 * Format transaction status
 */
export declare function formatTxStatus(status: string): string;
/**
 * Create a clean multiline string for chat
 */
export declare function createChatMessage(lines: string[]): string;
//# sourceMappingURL=formatters.d.ts.map