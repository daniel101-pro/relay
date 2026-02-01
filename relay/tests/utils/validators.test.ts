import { describe, it, expect } from 'vitest';
import {
  isValidAddress,
  isValidTxHash,
  isValidENS,
  detectInputType,
  extractAddresses,
  extractTxHashes,
} from '../../src/utils/validators.js';

describe('Validators', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b')).toBe(true);
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('not an address')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('isValidTxHash', () => {
    it('should validate correct transaction hashes', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(isValidTxHash(validHash)).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(isValidTxHash('0x' + 'a'.repeat(63))).toBe(false);
      expect(isValidTxHash('0x' + 'g'.repeat(64))).toBe(false);
      expect(isValidTxHash('')).toBe(false);
    });
  });

  describe('isValidENS', () => {
    it('should validate correct ENS names', () => {
      expect(isValidENS('vitalik.eth')).toBe(true);
      expect(isValidENS('my-wallet.eth')).toBe(true);
    });

    it('should reject invalid ENS names', () => {
      expect(isValidENS('vitalik')).toBe(false);
      expect(isValidENS('.eth')).toBe(false);
      expect(isValidENS('vitalik.com')).toBe(false);
    });
  });

  describe('detectInputType', () => {
    it('should detect addresses', () => {
      expect(detectInputType('0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b')).toBe('address');
    });

    it('should detect transaction hashes', () => {
      expect(detectInputType('0x' + 'a'.repeat(64))).toBe('txHash');
    });

    it('should detect ENS names', () => {
      expect(detectInputType('vitalik.eth')).toBe('ens');
    });

    it('should return unknown for other inputs', () => {
      expect(detectInputType('hello world')).toBe('unknown');
    });
  });

  describe('extractAddresses', () => {
    it('should extract valid addresses from text', () => {
      const text = 'Send to 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b please';
      const addresses = extractAddresses(text);
      expect(addresses).toHaveLength(1);
    });

    it('should return empty array for text without addresses', () => {
      expect(extractAddresses('no addresses here')).toEqual([]);
    });
  });

  describe('extractTxHashes', () => {
    it('should extract valid tx hashes from text', () => {
      const hash = '0x' + 'a'.repeat(64);
      const text = `Check transaction ${hash}`;
      const hashes = extractTxHashes(text);
      expect(hashes).toHaveLength(1);
      expect(hashes[0]).toBe(hash);
    });
  });
});
