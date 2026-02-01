import { z } from 'zod';
import { RiskLevel, IntentType } from './intent.js';

/**
 * Skill execution result (raw output before formatting)
 */
export const SkillResultSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  riskLevel: z.enum([
    RiskLevel.LOW,
    RiskLevel.MEDIUM,
    RiskLevel.HIGH,
    RiskLevel.CRITICAL,
  ]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SkillResult = z.infer<typeof SkillResultSchema>;

/**
 * Formatted response ready for user
 */
export const RelayResponseSchema = z.object({
  // Main response content
  message: z.string(),

  // What intent was handled
  intent: z.enum([
    IntentType.EXPLAIN,
    IntentType.VERIFY,
    IntentType.CREATE,
    IntentType.SEND,
    IntentType.PROOF,
    IntentType.SAFETY,
    IntentType.WALLET,
    IntentType.UNKNOWN,
  ]),

  // Risk assessment
  riskLevel: z.enum([
    RiskLevel.LOW,
    RiskLevel.MEDIUM,
    RiskLevel.HIGH,
    RiskLevel.CRITICAL,
  ]).optional(),

  // Confidence in the response
  confidence: z.number().min(0).max(1).optional(),

  // Any warnings to show user
  warnings: z.array(z.string()).default([]),

  // Suggested follow-up actions
  suggestions: z.array(z.string()).default([]),

  // Structured data (for receipts, contract details, etc.)
  structuredData: z.record(z.string(), z.unknown()).optional(),

  // For proof/receipt mode - shareable content
  shareable: z.object({
    text: z.string(),
    link: z.string().optional(),
  }).optional(),

  // Processing metadata
  processingTime: z.number().optional(), // ms
  timestamp: z.date(),
});

export type RelayResponse = z.infer<typeof RelayResponseSchema>;

/**
 * Create a successful response
 */
export function createSuccessResponse(
  message: string,
  intent: IntentType,
  options: Partial<Omit<RelayResponse, 'message' | 'intent' | 'timestamp'>> = {}
): RelayResponse {
  return {
    message,
    intent,
    timestamp: new Date(),
    warnings: [],
    suggestions: [],
    ...options,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  intent: IntentType = IntentType.UNKNOWN
): RelayResponse {
  return {
    message: `I encountered an issue: ${error}. Please try again or rephrase your request.`,
    intent,
    timestamp: new Date(),
    warnings: [error],
    suggestions: ['Try rephrasing your request', 'Check if addresses/hashes are correct'],
    riskLevel: RiskLevel.MEDIUM,
  };
}
