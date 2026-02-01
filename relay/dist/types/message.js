import { z } from 'zod';
/**
 * Message source/channel
 */
export const MessageSource = {
    WHATSAPP: 'whatsapp',
    IMESSAGE: 'imessage',
    WEB: 'web',
    CLI: 'cli',
};
/**
 * Incoming message from user
 */
export const IncomingMessageSchema = z.object({
    id: z.string(),
    userId: z.string(),
    text: z.string(),
    source: z.enum([
        MessageSource.WHATSAPP,
        MessageSource.IMESSAGE,
        MessageSource.WEB,
        MessageSource.CLI,
    ]),
    timestamp: z.date(),
    attachments: z.array(z.object({
        type: z.enum(['image', 'file', 'screenshot']),
        url: z.string().optional(),
        data: z.string().optional(), // base64 for images
    })).default([]),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
/**
 * Create an incoming message with defaults
 */
export function createMessage(text, userId = 'anonymous', source = MessageSource.CLI) {
    return {
        id: crypto.randomUUID(),
        userId,
        text,
        source,
        timestamp: new Date(),
        attachments: [],
    };
}
//# sourceMappingURL=message.js.map