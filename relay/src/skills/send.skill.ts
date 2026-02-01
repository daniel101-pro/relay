import { BaseSkill } from './base-skill.js';
import {
  IntentType,
  IntentContext,
  SkillResult,
  RiskLevel,
} from '../types/index.js';

/**
 * Send Skill - Handles fund transfers and payments
 *
 * "Move money"
 *
 * Takes: Amount, recipient (address or ENS), optional currency
 * Returns: Transaction preparation, confirmation request, execution status
 */
export class SendSkill extends BaseSkill {
  readonly name = 'send';
  readonly description = 'Handles cryptocurrency transfers and payments';
  readonly handledIntents = [IntentType.SEND];

  async validate(context: IntentContext): Promise<{ valid: boolean; error?: string }> {
    const { entities } = context.intent;

    // Need recipient
    const hasRecipient =
      entities.addresses.length > 0 ||
      entities.ensNames.length > 0 ||
      entities.recipients.length > 0;

    if (!hasRecipient) {
      return {
        valid: false,
        error: 'Please specify a recipient address, ENS name, or contact name.',
      };
    }

    // Need amount
    if (entities.amounts.length === 0) {
      return {
        valid: false,
        error: 'Please specify an amount to send.',
      };
    }

    return { valid: true };
  }

  async execute(context: IntentContext): Promise<SkillResult> {
    const { entities } = context.intent;

    // Extract transfer details
    const recipient = this.resolveRecipient(entities);
    const amount = entities.amounts[0];

    // TODO: Implement actual wallet connection and transaction signing
    // TODO: Implement ENS resolution
    // TODO: Implement fiat-to-crypto conversion

    // For MVP, return a prepared transaction for confirmation
    const preparedTx = {
      to: recipient.resolved || recipient.original,
      value: amount.value,
      currency: amount.currency,
      estimatedGas: '21000',
      estimatedFee: '0.001 ETH',
      network: 'ethereum',
    };

    // Calculate equivalent values
    const equivalents = this.calculateEquivalents(amount);

    return this.success(
      {
        type: 'send_preparation',
        status: 'pending_confirmation',
        transaction: preparedTx,
        recipient: {
          original: recipient.original,
          resolved: recipient.resolved,
          type: recipient.type,
        },
        amount: {
          ...amount,
          equivalents,
        },
        fees: {
          gas: '21000',
          gasPrice: '30 gwei',
          totalFee: '0.00063 ETH',
          feeUSD: '$1.50',
        },
        comparison: {
          bankFee: '$25-50',
          savings: 'Up to $48.50',
          speed: '~15 seconds vs 1-3 business days',
        },
        warnings: this.getWarnings(preparedTx, recipient),
        confirmationRequired: true,
        confirmationMessage: `Ready to send ${amount.value} ${amount.currency} to ${recipient.original}. Reply "confirm" to proceed.`,
      },
      {
        riskLevel: this.assessTransferRisk(preparedTx, recipient),
        confidence: 0.9,
      }
    );
  }

  private resolveRecipient(entities: {
    addresses: string[];
    ensNames: string[];
    recipients: string[];
  }): { original: string; resolved?: string; type: string } {
    if (entities.addresses.length > 0) {
      return {
        original: entities.addresses[0],
        resolved: entities.addresses[0],
        type: 'address',
      };
    }

    if (entities.ensNames.length > 0) {
      // TODO: Actually resolve ENS
      return {
        original: entities.ensNames[0],
        resolved: '0x1234...resolved',
        type: 'ens',
      };
    }

    if (entities.recipients.length > 0) {
      // TODO: Look up in contacts/address book
      return {
        original: entities.recipients[0],
        type: 'contact',
      };
    }

    return { original: 'unknown', type: 'unknown' };
  }

  private calculateEquivalents(amount: { value: string; currency: string }): Record<string, string> {
    // TODO: Implement real price lookups
    const ethPrice = 2500; // Mock price

    if (amount.currency.toUpperCase() === 'ETH') {
      const usdValue = parseFloat(amount.value) * ethPrice;
      return {
        USD: `$${usdValue.toFixed(2)}`,
        GBP: `£${(usdValue * 0.79).toFixed(2)}`,
        EUR: `€${(usdValue * 0.92).toFixed(2)}`,
      };
    }

    // Handle fiat amounts
    if (['USD', 'GBP', 'EUR', '£', '$', '€'].some((c) => amount.currency.includes(c))) {
      let usdValue = parseFloat(amount.value);
      if (amount.currency.includes('£') || amount.currency === 'GBP') {
        usdValue = parseFloat(amount.value) / 0.79;
      }
      const ethValue = usdValue / ethPrice;
      return {
        ETH: `${ethValue.toFixed(6)} ETH`,
        USD: `$${usdValue.toFixed(2)}`,
      };
    }

    return {};
  }

  private getWarnings(
    tx: Record<string, unknown>,
    recipient: { original: string; resolved?: string; type: string }
  ): string[] {
    const warnings: string[] = [];

    if (recipient.type === 'contact' && !recipient.resolved) {
      warnings.push('Contact address not found. Please provide an address or ENS name.');
    }

    if (recipient.type === 'address') {
      // TODO: Check if address has received transactions before
      warnings.push('First time sending to this address. Please verify it is correct.');
    }

    return warnings;
  }

  private assessTransferRisk(
    tx: Record<string, unknown>,
    recipient: { original: string; resolved?: string; type: string }
  ): RiskLevel {
    // TODO: Implement actual risk assessment
    // Check: recipient history, amount relative to usual, new address, etc.

    if (!recipient.resolved) {
      return RiskLevel.HIGH;
    }

    return RiskLevel.LOW;
  }
}
