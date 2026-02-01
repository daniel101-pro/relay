import { z } from 'zod';
/**
 * Message source/channel
 */
export declare const MessageSource: {
    readonly WHATSAPP: "whatsapp";
    readonly IMESSAGE: "imessage";
    readonly WEB: "web";
    readonly CLI: "cli";
};
export type MessageSource = (typeof MessageSource)[keyof typeof MessageSource];
/**
 * Incoming message from user
 */
export declare const IncomingMessageSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    text: z.ZodString;
    source: z.ZodEnum<{
        whatsapp: "whatsapp";
        imessage: "imessage";
        web: "web";
        cli: "cli";
    }>;
    timestamp: z.ZodDate;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            file: "file";
            image: "image";
            screenshot: "screenshot";
        }>;
        url: z.ZodOptional<z.ZodString>;
        data: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;
/**
 * Create an incoming message with defaults
 */
export declare function createMessage(text: string, userId?: string, source?: MessageSource): IncomingMessage;
/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
    userId: string;
    messages: IncomingMessage[];
    lastIntent?: string;
    sessionData?: Record<string, unknown>;
}
//# sourceMappingURL=message.d.ts.map