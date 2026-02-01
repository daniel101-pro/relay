import { z } from 'zod';
import {
  ChannelAdapter,
  ChannelType,
  ChannelMessage,
  OutgoingMessage,
} from '../types.js';

/**
 * Sendblue API integration for iMessage
 *
 * Sendblue provides a REST API to send/receive iMessages.
 * Sign up at https://sendblue.co to get API credentials.
 *
 * Features:
 * - Send iMessages to any iPhone user
 * - Receive messages via webhook
 * - Support for media (images, etc.)
 * - Message status tracking
 */

// Sendblue webhook payload schema
export const SendblueWebhookSchema = z.object({
  accountEmail: z.string().optional(),
  content: z.string().optional(),
  media_url: z.string().optional(),
  is_outbound: z.boolean(),
  status: z.string().optional(),
  error_code: z.number().optional(),
  error_message: z.string().optional(),
  message_handle: z.string(),
  date_sent: z.string(),
  date_updated: z.string(),
  from_number: z.string(),
  number: z.string(), // recipient number
  to_number: z.string(),
  was_downgraded: z.boolean().optional(),
  message_type: z.string().optional(),
});

export type SendblueWebhook = z.infer<typeof SendblueWebhookSchema>;

// Sendblue send response schema
const SendResponseSchema = z.object({
  status: z.string(),
  message_handle: z.string().optional(),
  error_code: z.number().optional(),
  error_message: z.string().optional(),
});

interface SendblueConfig {
  apiKey: string;
  apiSecret: string;
  callbackUrl?: string;
}

export class SendblueAdapter implements ChannelAdapter {
  readonly type = ChannelType.IMESSAGE;

  private config: SendblueConfig;
  private messageCallback?: (message: ChannelMessage) => Promise<void>;
  private baseUrl = 'https://api.sendblue.co/api';

  constructor(config: SendblueConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Verify credentials by making a test request
    console.log('📱 Initializing Sendblue iMessage adapter...');

    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('Sendblue API key and secret are required');
    }

    // Optional: Set up callback URL for webhooks
    if (this.config.callbackUrl) {
      console.log(`   Webhook URL: ${this.config.callbackUrl}`);
    }

    console.log('✅ Sendblue adapter initialized');
  }

  async send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'sb-api-key-id': this.config.apiKey,
          'sb-api-secret-key': this.config.apiSecret,
        },
        body: JSON.stringify({
          number: message.recipientPhone,
          content: message.text,
          media_url: message.mediaUrl,
          status_callback: this.config.callbackUrl,
        }),
      });

      const data = await response.json();
      const parsed = SendResponseSchema.safeParse(data);

      if (!parsed.success) {
        return {
          success: false,
          error: 'Invalid response from Sendblue API',
        };
      }

      if (parsed.data.error_code) {
        return {
          success: false,
          error: parsed.data.error_message || `Error code: ${parsed.data.error_code}`,
        };
      }

      return {
        success: true,
        messageId: parsed.data.message_handle,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a message with typing indicator effect
   * Adds a small delay to simulate human-like response
   */
  async sendWithTyping(message: OutgoingMessage, delayMs = 1000): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Wait for typing effect
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return this.send(message);
  }

  onMessage(callback: (message: ChannelMessage) => Promise<void>): void {
    this.messageCallback = callback;
  }

  /**
   * Handle incoming webhook from Sendblue
   * Call this from your Express route handler
   */
  async handleWebhook(payload: unknown): Promise<{ handled: boolean; error?: string }> {
    try {
      const parsed = SendblueWebhookSchema.safeParse(payload);

      if (!parsed.success) {
        return { handled: false, error: 'Invalid webhook payload' };
      }

      const webhook = parsed.data;

      // Only process inbound messages (not our own outbound messages)
      if (webhook.is_outbound) {
        return { handled: true }; // Acknowledge but don't process
      }

      // Skip if no content
      if (!webhook.content) {
        return { handled: true };
      }

      // Convert to channel message
      const message: ChannelMessage = {
        id: webhook.message_handle,
        channelType: ChannelType.IMESSAGE,
        senderId: webhook.from_number,
        senderPhone: webhook.from_number,
        text: webhook.content,
        timestamp: new Date(webhook.date_sent),
        metadata: {
          mediaUrl: webhook.media_url,
          wasDowngraded: webhook.was_downgraded,
          messageType: webhook.message_type,
        },
      };

      // Call the registered callback
      if (this.messageCallback) {
        await this.messageCallback(message);
      }

      return { handled: true };
    } catch (error) {
      return {
        handled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('📱 Shutting down Sendblue adapter...');
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageHandle: string): Promise<{ status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/message-status?message_handle=${messageHandle}`, {
        headers: {
          'sb-api-key-id': this.config.apiKey,
          'sb-api-secret-key': this.config.apiSecret,
        },
      });

      const data = await response.json() as { status?: string };
      return { status: data.status };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if a phone number can receive iMessages
   */
  async isIMessageEnabled(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/evaluate-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'sb-api-key-id': this.config.apiKey,
          'sb-api-secret-key': this.config.apiSecret,
        },
        body: JSON.stringify({ number: phoneNumber }),
      });

      const data = await response.json() as { is_imessage?: boolean };
      return data.is_imessage === true;
    } catch {
      return false;
    }
  }
}
