import { z } from 'zod';

/**
 * Supported intent types for Relay agent
 */
export const IntentType = {
  EXPLAIN: 'explain',
  VERIFY: 'verify',
  CREATE: 'create',
  SEND: 'send',
  PROOF: 'proof',
  SAFETY: 'safety',
  WALLET: 'wallet',
  UNKNOWN: 'unknown',
} as const;

export type IntentType = (typeof IntentType)[keyof typeof IntentType];

/**
 * Risk level assessment
 */
export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

/**
 * Supported blockchain networks
 */
export const Network = {
  ETHEREUM: 'ethereum',
  BASE: 'base',
} as const;

export type Network = (typeof Network)[keyof typeof Network];

/**
 * Extracted entities from user message
 */
export const EntitiesSchema = z.object({
  addresses: z.array(z.string()).default([]),
  transactionHashes: z.array(z.string()).default([]),
  ensNames: z.array(z.string()).default([]),
  amounts: z.array(z.object({
    value: z.string(),
    currency: z.string(),
  })).default([]),
  recipients: z.array(z.string()).default([]),
  contractTypes: z.array(z.string()).default([]),
});

export type Entities = z.infer<typeof EntitiesSchema>;

/**
 * Classified intent with extracted entities
 */
export const ClassifiedIntentSchema = z.object({
  type: z.enum([
    IntentType.EXPLAIN,
    IntentType.VERIFY,
    IntentType.CREATE,
    IntentType.SEND,
    IntentType.PROOF,
    IntentType.SAFETY,
    IntentType.WALLET,
    IntentType.UNKNOWN,
  ]),
  confidence: z.number().min(0).max(1),
  entities: EntitiesSchema,
  reasoning: z.string().optional(),
  suggestedNetwork: z.enum([Network.ETHEREUM, Network.BASE]).nullable().optional(),
});

export type ClassifiedIntent = z.infer<typeof ClassifiedIntentSchema>;

/**
 * Intent context passed to skill handlers
 */
export interface IntentContext {
  intent: ClassifiedIntent;
  originalMessage: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
