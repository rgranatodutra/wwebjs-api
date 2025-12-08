import { MessageUpsertType, WAMessage } from "baileys";

import BaileysWhatsappClient from "./baileys-whatsapp-client";
import ProcessingLogger from "../../../../utils/processing-logger";
import parseMessage from "./parse-message";

interface MessageUpsertContext {
  client: BaileysWhatsappClient;
  logger: ProcessingLogger;
  messages: WAMessage[];
  type: MessageUpsertType;
}

async function handleMessageUpsert({ messages, type, client, logger }: MessageUpsertContext) {
  logger.log(`Received messages upsert of type ${type}`, { messageCount: messages.length });

  for (const message of messages) {
    if (message.key.fromMe) {
      logger.log("Skipping own message", { messageId: message.key?.id });
      continue;
    }

    if (message.message) {
      logger.log("Saving raw message to storage", { messageId: message.key?.id });
      await client._storage.saveRawMessage(client.sessionId, message.message, message.key);

      logger.log("Processing incoming message", { messageId: message.key?.id });

      const parsedMessage = await parseMessage({
        message,
        instance: client.instance,
        clientId: client.clientId,
        phone: client.phone,
      });

      logger.log("Message parsed successfully", { parsedMessage });
      client._ev.emit({
        type: "message-received",
        clientId: client.clientId,
        message: parsedMessage,
      });
      logger.log("Emitted message-received event", { messageId: message.key?.id });
    }
  }

  logger.success({ processedMessages: messages.length, type });
}

export default handleMessageUpsert;
