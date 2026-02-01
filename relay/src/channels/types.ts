import { z } from 'zod';

/**
 * Channel types for Relay messaging
 */

export enum ChannelType {
  CLI = 'cli',
  IMESSAGE = 'imessage',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  WEB = 'web',
}

/**
 * Incoming message from any channel
 */
export const ChannelMessageSchema = z.object({
  id: z.string(),
  channelType: z.nativeEnum(ChannelType),
  senderId: z.string(),
  senderPhone: z.string().optional(),
  text: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ChannelMessage = z.infer<typeof ChannelMessageSchema>;

/**
 * Outgoing message to any channel
 */
export interface OutgoingMessage {
  recipientId: string;
  recipientPhone?: string;
  text: string;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Channel adapter interface - all channels must implement this
 */
export interface ChannelAdapter {
  readonly type: ChannelType;

  /**
   * Initialize the channel (connect, authenticate, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Send a message through the channel
   */
  send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: (message: ChannelMessage) => Promise<void>): void;

  /**
   * Shut down the channel gracefully
   */
  shutdown(): Promise<void>;
}

/**
 * Channel configuration
 */
export interface ChannelConfig {
  enabled: boolean;
  webhookPath?: string;
  apiKey?: string;
  apiSecret?: string;
  [key: string]: unknown;
}
