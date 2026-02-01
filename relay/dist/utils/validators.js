import { getAddress } from 'ethers';
/**
 * Validate Ethereum address
 * Uses regex for format validation - sufficient for MVP
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Validate transaction hash
 */
export function isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
/**
 * Validate ENS name
 */
export function isValidENS(name) {
    // Basic ENS validation
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.eth$/.test(name);
}
/**
 * Validate block number
 */
export function isValidBlockNumber(block) {
    const num = typeof block === 'string' ? parseInt(block) : block;
    return Number.isInteger(num) && num >= 0;
}
/**
 * Normalize address to checksum format
 */
export function normalizeAddress(address) {
    try {
        return getAddress(address);
    }
    catch {
        return address;
    }
}
/**
 * Validate amount string
 */
export function isValidAmount(amount) {
    try {
        const parsed = parseFloat(amount);
        return !isNaN(parsed) && parsed > 0;
    }
    catch {
        return false;
    }
}
/**
 * Extract and validate addresses from text
 */
export function extractAddresses(text) {
    const matches = text.match(/0x[a-fA-F0-9]{40}/g) || [];
    return matches.filter(isValidAddress).map(normalizeAddress);
}
/**
 * Extract and validate transaction hashes from text
 */
export function extractTxHashes(text) {
    const matches = text.match(/0x[a-fA-F0-9]{64}/g) || [];
    return matches.filter(isValidTxHash);
}
/**
 * Extract ENS names from text
 */
export function extractENSNames(text) {
    const matches = text.match(/\b[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.eth\b/g) || [];
    return matches.filter(isValidENS);
}
/**
 * Detect input type
 */
export function detectInputType(input) {
    input = input.trim();
    if (isValidTxHash(input)) {
        return 'txHash';
    }
    if (isValidAddress(input)) {
        return 'address';
    }
    if (isValidENS(input)) {
        return 'ens';
    }
    return 'unknown';
}
/**
 * Validate currency code
 */
export function isValidCurrency(currency) {
    const validCurrencies = [
        'ETH',
        'WETH',
        'USDC',
        'USDT',
        'DAI',
        'WBTC',
        'USD',
        'GBP',
        'EUR',
    ];
    return validCurrencies.includes(currency.toUpperCase());
}
//# sourceMappingURL=validators.js.map