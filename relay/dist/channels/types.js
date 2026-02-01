import { z } from 'zod';
/**
 * Channel types for Relay messaging
 */
export var ChannelType;
(function (ChannelType) {
    ChannelType["CLI"] = "cli";
    ChannelType["IMESSAGE"] = "imessage";
    ChannelType["WHATSAPP"] = "whatsapp";
    ChannelType["TELEGRAM"] = "telegram";
    ChannelType["WEB"] = "web";
})(ChannelType || (ChannelType = {}));
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
//# sourceMappingURL=types.js.map