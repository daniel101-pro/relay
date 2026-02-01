import { z } from 'zod';

/**
 * Message source/channel
 */
export const MessageSource = {
  WHATSAPP: 'whatsapp',
  IMESSAGE: 'imessage',
  WEB: 'web',
  CLI: 'cli',
} as const;

export type MessageSource = (typeof MessageSource)[keyof typeof MessageSource];

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

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

/**
 * Create an incoming message with defaults
 */
export function createMessage(
  text: string,
  userId: string = 'anonymous',
  source: MessageSource = MessageSource.CLI
): IncomingMessage {
  return {
    id: crypto.randomUUID(),
    userId,
    text,
    source,
    timestamp: new Date(),
    attachments: [],
  };
}

/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
  userId: string;
  messages: IncomingMessage[];
  lastIntent?: string;
  sessionData?: Record<string, unknown>;
}
