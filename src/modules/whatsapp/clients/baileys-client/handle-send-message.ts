import { AnyMediaMessageContent, AnyRegularMessageContent, jidNormalizedUser } from "baileys";
import { SendFileOptions, SendMessageOptions } from "../../types";
import BaileysWhatsappClient from "./baileys-whatsapp-client";
import parseMessage from "./parse-message";
import { phoneToAltBr } from "../../../../utils/phone.utils";
import ProcessingLogger from "../../../../utils/processing-logger";
import { Logger } from "@in.pulse-crm/utils";

interface SendMessageContext {
  client: BaileysWhatsappClient;
  options: SendMessageOptions;
  isGroup: boolean;
  logger: ProcessingLogger;
}

/**
 * Normalize phone number to JID format
 * Converts "5511999999999" to "5511999999999@s.whatsapp.net"
 */
function normalizeToJid(to: string): string {
  // Remove any existing @s.whatsapp.net suffix
  const cleanPhone = to.replace("@s.whatsapp.net", "").trim();

  // Validate it's a valid phone number
  if (!cleanPhone || !/^\d+$/.test(cleanPhone)) {
    throw new Error(`Invalid phone number format: ${to}`);
  }

  return `${cleanPhone}@s.whatsapp.net`;
}

async function handleSendMessage({ client, options, isGroup, logger }: SendMessageContext, tryCount: number = 0) {
  try {
    logger.log(`Iniciando envio de mensagem para: ${options.to} (tentativa ${tryCount + 1})`);

    const normalizedTo = normalizeToJid(options.to);
    logger.debug(`JID normalizado: ${normalizedTo}`);

    const jid = jidNormalizedUser(normalizedTo);

    if (!jid) {
      throw new Error(`Failed to normalize JID for phone: ${options.to}`);
    }

    const messageOptions = getMessageOptions(options);
    logger.debug(`Opções de mensagem preparadas`, { isGroup });

    const message = await client._sock.sendMessage(jid, messageOptions);

    if (!message) {
      throw new Error("Failed to send message");
    }

    logger.log(`Mensagem enviada com sucesso para: ${jid}`);

    const parsedMessage = parseMessage({
      message,
      instance: client.instance,
      clientId: client.clientId,
      phone: client.phone,
    });

    Logger.debug("Mensagem parseada com sucesso", parsedMessage);
    logger.success(parsedMessage);
    return parsedMessage;
  } catch (err) {
    if (tryCount == 0) {
      logger.log(`Falha na primeira tentativa, convertendo para formato alternativo`);
      options.to = phoneToAltBr(options.to);
      return handleSendMessage({ client, options, isGroup, logger }, tryCount + 1);
    }
    throw err;
  }
}

function getMessageOptions(options: SendMessageOptions): AnyRegularMessageContent {
  const isFileMessage = "fileUrl" in options;

  if (isFileMessage) {
    return getFileMessageOptions(options as SendFileOptions);
  }
  if (!options.text) {
    throw new Error("Text message must have 'text' property");
  }
  return {
    text: options.text || "",
  };
}

function getFileMessageOptions(options: SendFileOptions): AnyMediaMessageContent {
  const isImage = options.fileType?.includes("image");
  const isVideo = options.fileType?.includes("video");
  const isAudio = options.fileType?.includes("audio");

  if (isImage) {
    return {
      image: { url: options.fileUrl },
      ...(options.text ? { caption: options.text } : {}),
    };
  }
  if (isVideo) {
    return {
      video: { url: options.fileUrl },
      ...(options.text ? { caption: options.text } : {}),
    };
  }
  if (isAudio) {
    return {
      audio: { url: options.fileUrl },
      ...(options.text ? { caption: options.text } : {}),
    };
  }

  return {
    document: {
      url: options.fileUrl,
    },
    mimetype: options.fileType || "application/octet-stream",
    fileName: options.fileName,
    ...(options.text ? { caption: options.text } : {}),
  };
}

export default handleSendMessage;
