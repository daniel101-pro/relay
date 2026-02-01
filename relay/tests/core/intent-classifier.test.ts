import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '../../src/core/intent-classifier.js';

describe('IntentClassifier', () => {
  describe('hasBlockchainEntities', () => {
    it('should detect Ethereum addresses', () => {
      const message = 'Check this address 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b';
      expect(IntentClassifier.hasBlockchainEntities(message)).toBe(true);
    });

    it('should detect transaction hashes', () => {
      const message =
        'What is 0x' + 'a'.repeat(64);
      expect(IntentClassifier.hasBlockchainEntities(message)).toBe(true);
    });

    it('should detect ENS names', () => {
      const message = 'Send to vitalik.eth';
      expect(IntentClassifier.hasBlockchainEntities(message)).toBe(true);
    });

    it('should return false for plain text', () => {
      const message = 'Hello, how are you?';
      expect(IntentClassifier.hasBlockchainEntities(message)).toBe(false);
    });
  });

  describe('extractEntitiesQuick', () => {
    it('should extract addresses', () => {
      const message = 'Check 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b and 0x1234567890123456789012345678901234567890';
      const entities = IntentClassifier.extractEntitiesQuick(message);
      expect(entities.addresses).toHaveLength(2);
    });

    it('should extract transaction hashes', () => {
      const txHash = '0x' + 'a'.repeat(64);
      const message = `Look at ${txHash}`;
      const entities = IntentClassifier.extractEntitiesQuick(message);
      expect(entities.transactionHashes).toHaveLength(1);
      expect(entities.transactionHashes[0]).toBe(txHash);
    });

    it('should extract ENS names', () => {
      const message = 'Send to vitalik.eth and nick.eth';
      const entities = IntentClassifier.extractEntitiesQuick(message);
      expect(entities.ensNames).toHaveLength(2);
      expect(entities.ensNames).toContain('vitalik.eth');
      expect(entities.ensNames).toContain('nick.eth');
    });

    it('should deduplicate results', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE8b';
      const message = `${address} and again ${address}`;
      const entities = IntentClassifier.extractEntitiesQuick(message);
      expect(entities.addresses).toHaveLength(1);
    });
  });
});
