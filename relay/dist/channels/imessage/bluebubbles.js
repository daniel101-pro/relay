import { ChannelType, } from '../types.js';
export class BlueBubblesAdapter {
    type = ChannelType.IMESSAGE;
    config;
    messageCallback;
    ws;
    lastMessageDate = Date.now();
    pollTimer;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    constructor(config) {
        this.config = {
            pollInterval: 3000,
            ...config,
        };
    }
    async initialize() {
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
        }
        catch (error) {
            console.log('   ⚠️ WebSocket failed, using polling fallback');
            this.startPolling();
        }
        console.log('✅ BlueBubbles adapter initialized');
    }
    /**
     * Ping the server to check connection
     */
    async ping() {
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/server/info`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
    }
    /**
     * Get auth headers
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.config.password,
        };
    }
    /**
     * Send an iMessage
     */
    async send(message) {
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
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}`,
                };
            }
            const data = await response.json();
            return {
                success: true,
                messageId: data.data?.guid,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message',
            };
        }
    }
    /**
     * Send with typing indicator
     */
    async sendWithTyping(message, delayMs = 1500) {
        const phone = message.recipientPhone || message.recipientId;
        // Send typing indicator
        if (phone) {
            try {
                await fetch(`${this.config.serverUrl}/api/v1/chat/${encodeURIComponent(`iMessage;-;${phone}`)}/typing`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ status: true }),
                });
            }
            catch {
                // Ignore typing indicator errors
            }
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.send(message);
    }
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Handle webhook (for external webhook setup)
     */
    async handleWebhook(payload) {
        try {
            const data = payload;
            if (!data.guid || data.isFromMe) {
                return { handled: true };
            }
            const message = {
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
        }
        catch (error) {
            return {
                handled: false,
                error: error instanceof Error ? error.message : 'Failed to process webhook',
            };
        }
    }
    async shutdown() {
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
    async connectWebSocket() {
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
                this.handleWebSocketMessage(event.data);
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
    handleWebSocketMessage(data) {
        // Socket.IO protocol parsing
        if (data.startsWith('42')) {
            try {
                const payload = JSON.parse(data.substring(2));
                const [event, message] = payload;
                if (event === 'new-message' && !message.isFromMe && message.text) {
                    const channelMessage = {
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
            }
            catch {
                // Ignore parsing errors
            }
        }
    }
    /**
     * Handle WebSocket close
     */
    handleWebSocketClose() {
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
    startPolling() {
        this.pollTimer = setInterval(async () => {
            try {
                await this.pollMessages();
            }
            catch {
                // Ignore polling errors
            }
        }, this.config.pollInterval);
    }
    /**
     * Poll for new messages
     */
    async pollMessages() {
        if (!this.messageCallback)
            return;
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/message?after=${this.lastMessageDate}&limit=50`, { headers: this.getHeaders() });
            if (!response.ok)
                return;
            const data = await response.json();
            for (const msg of data.data || []) {
                if (!msg.isFromMe && msg.text && msg.dateCreated > this.lastMessageDate) {
                    this.lastMessageDate = msg.dateCreated;
                    const channelMessage = {
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
        }
        catch {
            // Ignore errors
        }
    }
    /**
     * Get chat history
     */
    async getChatHistory(phone, limit = 25) {
        try {
            const chatGuid = `iMessage;-;${phone}`;
            const response = await fetch(`${this.config.serverUrl}/api/v1/chat/${encodeURIComponent(chatGuid)}/message?limit=${limit}`, { headers: this.getHeaders() });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        }
        catch {
            return [];
        }
    }
    /**
     * Send a reaction to a message
     */
    async sendReaction(messageGuid, reaction) {
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/message/${messageGuid}/react`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ reaction }),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=bluebubbles.js.map