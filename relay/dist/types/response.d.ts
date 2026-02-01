import { z } from 'zod';
import { IntentType } from './intent.js';
/**
 * Skill execution result (raw output before formatting)
 */
export declare const SkillResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodString>;
    riskLevel: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>>;
    confidence: z.ZodOptional<z.ZodNumber>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type SkillResult = z.infer<typeof SkillResultSchema>;
/**
 * Formatted response ready for user
 */
export declare const RelayResponseSchema: z.ZodObject<{
    message: z.ZodString;
    intent: z.ZodEnum<{
        explain: "explain";
        verify: "verify";
        create: "create";
        send: "send";
        proof: "proof";
        safety: "safety";
        wallet: "wallet";
        unknown: "unknown";
    }>;
    riskLevel: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>>;
    confidence: z.ZodOptional<z.ZodNumber>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString>>;
    suggestions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    structuredData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    shareable: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        link: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    processingTime: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodDate;
}, z.core.$strip>;
export type RelayResponse = z.infer<typeof RelayResponseSchema>;
/**
 * Create a successful response
 */
export declare function createSuccessResponse(message: string, intent: IntentType, options?: Partial<Omit<RelayResponse, 'message' | 'intent' | 'timestamp'>>): RelayResponse;
/**
 * Create an error response
 */
export declare function createErrorResponse(error: string, intent?: IntentType): RelayResponse;
//# sourceMappingURL=response.d.ts.map