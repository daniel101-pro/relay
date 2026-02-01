/**
 * Validate Ethereum address
 * Uses regex for format validation - sufficient for MVP
 */
export declare function isValidAddress(address: string): boolean;
/**
 * Validate transaction hash
 */
export declare function isValidTxHash(hash: string): boolean;
/**
 * Validate ENS name
 */
export declare function isValidENS(name: string): boolean;
/**
 * Validate block number
 */
export declare function isValidBlockNumber(block: string | number): boolean;
/**
 * Normalize address to checksum format
 */
export declare function normalizeAddress(address: string): string;
/**
 * Validate amount string
 */
export declare function isValidAmount(amount: string): boolean;
/**
 * Extract and validate addresses from text
 */
export declare function extractAddresses(text: string): string[];
/**
 * Extract and validate transaction hashes from text
 */
export declare function extractTxHashes(text: string): string[];
/**
 * Extract ENS names from text
 */
export declare function extractENSNames(text: string): string[];
/**
 * Detect input type
 */
export declare function detectInputType(input: string): 'address' | 'txHash' | 'ens' | 'unknown';
/**
 * Validate currency code
 */
export declare function isValidCurrency(currency: string): boolean;
//# sourceMappingURL=validators.d.ts.map