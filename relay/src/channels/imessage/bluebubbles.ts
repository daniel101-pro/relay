import {
  ChannelAdapter,
  ChannelType,
  ChannelMessage,
  OutgoingMessage,
} from '../types.js';

/**
 * BlueBubbles iMessage Integration
 *
 * BlueBubbles is a free, open-source iMessage bridge that runs on your Mac.
 * It provides a REST API and WebSocket for real-time messaging.
 *
 * Setup:
 * 1. Download BlueBubbles Server from https://bluebubbles.app
 * 2. Install and run on a Mac with iMessage signed in
 * 3. Get your server URL and password from the app
 * 4. Optionally set up ngrok for remote access
 *
 * Features:
 * - Free and open source
 * - REST API for sending messages
 * - WebSocket for real-time incoming messages
 * - Supports attachments, reactions, typing indicators
 * - Works with group chats
 */

interface BlueBubblesConfig {
  serverUrl: string;      // e.g., http://localhost:1234 or ngrok URL
  password: string;       // Server password from BlueBubbles app
  pollInterval?: number;  // Fallback polling interval if WebSocket fails
}

interface BBMessage {
  guid: string;
  text: string;
  handle?: {
    address: string;
  };
  isFromMe: boolean;
  dateCreated: number;
  chats?: Array<{ guid: string }>;
}

interface BBResponse<T> {
  status: number;
  message: string;
  data: T;
}

export class BlueBubblesAdapter implements ChannelAdapter {
  readonly type = ChannelType.IMESSAGE;

  private config: BlueBubblesConfig;
  private messageCallback?: (message: ChannelMessage) => Promise<void>;
  private ws?: WebSocket;
  private lastMessageDate = Date.now();
  private pollTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: BlueBubblesConfig) {
    this.config = {
      pollInterval: 3000,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log('📱 Initializing BlueBubbles adapter...');
    console.log(`   Server: ${this.config.serverUrl}`);

    // Test connection
    const pingResult = await this.ping();
    if (!pingResult.success) {
      throw new Error(`Cannot connect to BlueBubbles server: ${pingResult.error}`);
    }

    console.log('   ✅ Connected to BlueBubbles server');

    // Try WebSocket first, fall back to polling
    try {
      await this.connectWebSocket();
      console.log('   ✅ WebSocket connected for real-time messages');
    } catch (error) {
      console.log('   ⚠️ WebSocket failed, using polling fallback');
      this.startPolling();
    }

    console.log('✅ BlueBubbles adapter initialized');
  }

  /**
   * Ping the server to check connection
   */
  private async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/v1/server/info`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Get auth headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.config.password,
    };
  }

  /**
   * Send an iMessage
   */
  async send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const phone = message.recipientPhone || message.recipientId;

      if (!phone) {
        return { success: false, error: 'No recipient provided' };
      }

      const response = await fetch(`${this.config.serverUrl}/api/v1/message/text`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          chatGuid: `iMessage;-;${phone}`,
          message: message.text,
          method: 'private-api', // Uses private API for better delivery
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json() as BBResponse<{ guid: string }>;

      return {
        success: true,
        messageId: data.data?.guid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Send with typing indicator
   */
  async sendWithTyping(message: OutgoingMessage, delayMs = 1500): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phone = message.recipientPhone || message.recipientId;

    // Send typing indicator
    if (phone) {
      try {
        await fetch(`${this.config.serverUrl}/api/v1/chat/${encodeURIComponent(`iMessage;-;${phone}`)}/typing`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ status: true }),
        });
      } catch {
        // Ignore typing indicator errors
      }
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return this.send(message);
  }

  onMessage(callback: (message: ChannelMessage) => Promise<void>): void {
    this.messageCallback = callback;
  }

  /**
   * Handle webhook (for external webhook setup)
   */
  async handleWebhook(payload: unknown): Promise<{ handled: boolean; error?: string }> {
    try {
      const data = payload as BBMessage;

      if (!data.guid || data.isFromMe) {
        return { handled: true };
      }

      const message: ChannelMessage = {
        id: data.guid,
        channelType: ChannelType.IMESSAGE,
        senderId: data.handle?.address || 'unknown',
        senderPhone: data.handle?.address,
        text: data.text || '',
        timestamp: new Date(data.dateCreated),
        metadata: {
          chatGuid: data.chats?.[0]?.guid,
        },
      };

      if (this.messageCallback) {
        await this.messageCallback(message);
      }

      return { handled: true };
    } catch (error) {
      return {
        handled: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('📱 Shutting down BlueBubbles adapter...');

    if (this.ws) {
      this.ws.close();
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  /**
   * Connect to WebSocket for real-time messages
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.serverUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://');

      this.ws = new WebSocket(`${wsUrl}/socket.io/?EIO=4&transport=websocket`);

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        // Authenticate
        this.ws?.send(`40{"password":"${this.config.password}"}`);
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data as string);
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.handleWebSocketClose();
      };
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    // Socket.IO protocol parsing
    if (data.startsWith('42')) {
      try {
        const payload = JSON.parse(data.substring(2)) as [string, BBMessage];
        const [event, message] = payload;

        if (event === 'new-message' && !message.isFromMe && message.text) {
          const channelMessage: ChannelMessage = {
            id: message.guid,
            channelType: ChannelType.IMESSAGE,
            senderId: message.handle?.address || 'unknown',
            senderPhone: message.handle?.address,
            text: message.text,
            timestamp: new Date(message.dateCreated),
          };

          console.log(`\n📨 New iMessage from ${channelMessage.senderPhone}: "${message.text.substring(0, 50)}..."`);

          if (this.messageCallback) {
            this.messageCallback(channelMessage).catch(console.error);
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleWebSocketClose(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`   WebSocket closed, reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connectWebSocket().catch(() => {
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('   Max reconnect attempts reached, falling back to polling');
            this.startPolling();
          }
        });
      }, 2000 * this.reconnectAttempts);
    }
  }

  /**
   * Start polling for new messages (fallback)
   */
  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      try {
        await this.pollMessages();
      } catch {
        // Ignore polling errors
      }
    }, this.config.pollInterval);
  }

  /**
   * Poll for new messages
   */
  private async pollMessages(): Promise<void> {
    if (!this.messageCallback) return;

    try {
      const response = await fetch(
        `${this.config.serverUrl}/api/v1/message?after=${this.lastMessageDate}&limit=50`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return;

      const data = await response.json() as BBResponse<BBMessage[]>;

      for (const msg of data.data || []) {
        if (!msg.isFromMe && msg.text && msg.dateCreated > this.lastMessageDate) {
          this.lastMessageDate = msg.dateCreated;

          const channelMessage: ChannelMessage = {
            id: msg.guid,
            channelType: ChannelType.IMESSAGE,
            senderId: msg.handle?.address || 'unknown',
            senderPhone: msg.handle?.address,
            text: msg.text,
            timestamp: new Date(msg.dateCreated),
          };

          await this.messageCallback(channelMessage);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(phone: string, limit = 25): Promise<BBMessage[]> {
    try {
      const chatGuid = `iMessage;-;${phone}`;
      const response = await fetch(
        `${this.config.serverUrl}/api/v1/chat/${encodeURIComponent(chatGuid)}/message?limit=${limit}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];

      const data = await response.json() as BBResponse<BBMessage[]>;
      return data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Send a reaction to a message
   */
  async sendReaction(messageGuid: string, reaction: 'love' | 'like' | 'dislike' | 'laugh' | 'emphasize' | 'question'): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/v1/message/${messageGuid}/react`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reaction }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
