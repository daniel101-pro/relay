import { z } from 'zod';
/**
 * Supported intent types for Relay agent
 */
export declare const IntentType: {
    readonly EXPLAIN: "explain";
    readonly VERIFY: "verify";
    readonly CREATE: "create";
    readonly SEND: "send";
    readonly PROOF: "proof";
    readonly SAFETY: "safety";
    readonly WALLET: "wallet";
    readonly UNKNOWN: "unknown";
};
export type IntentType = (typeof IntentType)[keyof typeof IntentType];
/**
 * Risk level assessment
 */
export declare const RiskLevel: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];
/**
 * Supported blockchain networks
 */
export declare const Network: {
    readonly ETHEREUM: "ethereum";
    readonly BASE: "base";
};
export type Network = (typeof Network)[keyof typeof Network];
/**
 * Extracted entities from user message
 */
export declare const EntitiesSchema: z.ZodObject<{
    addresses: z.ZodDefault<z.ZodArray<z.ZodString>>;
    transactionHashes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    ensNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
    amounts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        currency: z.ZodString;
    }, z.core.$strip>>>;
    recipients: z.ZodDefault<z.ZodArray<z.ZodString>>;
    contractTypes: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type Entities = z.infer<typeof EntitiesSchema>;
/**
 * Classified intent with extracted entities
 */
export declare const ClassifiedIntentSchema: z.ZodObject<{
    type: z.ZodEnum<{
        explain: "explain";
        verify: "verify";
        create: "create";
        send: "send";
        proof: "proof";
        safety: "safety";
        wallet: "wallet";
        unknown: "unknown";
    }>;
    confidence: z.ZodNumber;
    entities: z.ZodObject<{
        addresses: z.ZodDefault<z.ZodArray<z.ZodString>>;
        transactionHashes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        ensNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
        amounts: z.ZodDefault<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            currency: z.ZodString;
        }, z.core.$strip>>>;
        recipients: z.ZodDefault<z.ZodArray<z.ZodString>>;
        contractTypes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    reasoning: z.ZodOptional<z.ZodString>;
    suggestedNetwork: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        ethereum: "ethereum";
        base: "base";
    }>>>;
}, z.core.$strip>;
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
//# sourceMappingURL=intent.d.ts.map