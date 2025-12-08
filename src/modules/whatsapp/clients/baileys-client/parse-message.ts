import { downloadMediaMessage, WAMessage, WAMessageKey } from "baileys";
import MessageDto from "../../types";
import filesService from "../../../files/files.service";
import { FileDirType } from "@in.pulse-crm/sdk";
import { Logger } from "@in.pulse-crm/utils";

type MessageType = "chat" | "image" | "video" | "audio" | "document" | "sticker" | "unsupported";
interface ParseMessageParams {
  message: WAMessage;
  instance: string;
  clientId: number;
  phone: string;
}

interface BaseMessageContent {
  contactName: string;
  timestamp: string;
  quotedMessageId?: string | null;
}
interface MessageContent extends BaseMessageContent {
  type: MessageType;
  body: string;
  isFile: boolean;
}

interface FileMessageContent extends MessageContent {
  fileName: string;
  fileType: string;
  fileSize: string;
  isFile: true;
}

async function parseMessage({ message, instance, clientId, phone }: ParseMessageParams): Promise<MessageDto> {
  const { isFile, contactName, quotedMessageId, ...content } = getMessageContent(message);

  const messageSentAt = new Date(Number(content.timestamp.padEnd(13, "0")));
  const isFromMe = message.key.fromMe;
  const remotePhone = getMessageFrom(message.key);
  const isForwarded = getIsForwarded(message);

  const parsedMessage: MessageDto = {
    instance,
    clientId,
    wwebjsIdStanza: message.key.id || null,
    from: isFromMe ? phone : remotePhone,
    to: isFromMe ? remotePhone : phone,
    isForwarded,
    status: isFromMe ? "PENDING" : "RECEIVED",
    sentAt: messageSentAt,
    ...content,
  };

  Logger.debug("Parsed message", parsedMessage);

  if (isFile) {
    const uploadedFile = await processMediaFile(instance, message, content as FileMessageContent);

    return { ...parsedMessage, fileId: uploadedFile.id };
  }

  return parsedMessage;
}

function getMessageContent(message: WAMessage): MessageContent | FileMessageContent {
  const messageBase: BaseMessageContent = {
    contactName: getMessageContactName(message),
    timestamp: String(message.messageTimestamp),
    quotedMessageId: getMessageQuotedId(message),
  };

  if (message.message?.conversation) {
    return {
      ...messageBase,
      type: "chat",
      body: message.message.conversation,
      isFile: false,
    };
  }
  if (message.message?.audioMessage) {
    return {
      ...messageBase,
      body: message.message.conversation || "",
      type: "audio",
      fileName: "audio.ogg",
      fileType: message.message.audioMessage.mimetype || "audio/ogg; codecs=opus",
      fileSize: String(message.message.audioMessage.fileLength || 0),
      isFile: true,
    };
  }
  if (message.message?.imageMessage) {
    return {
      ...messageBase,
      body: message.message.imageMessage?.caption || "",
      type: "image",
      fileName: "image.jpg",
      fileType: message.message.imageMessage.mimetype || "image/jpeg",
      fileSize: String(message.message.imageMessage.fileLength || 0),
      isFile: true,
    };
  }
  if (message.message?.videoMessage) {
    return {
      ...messageBase,
      body: message.message.videoMessage?.caption || "",
      type: "video",
      fileName: "video.mp4",
      fileType: message.message.videoMessage.mimetype || "video/mp4",
      fileSize: String(message.message.videoMessage.fileLength || 0),
      isFile: true,
    };
  }
  if (message.message?.documentMessage) {
    return {
      ...messageBase,
      body: message.message.documentMessage?.caption || "",
      type: "document",
      fileName: message.message.documentMessage?.fileName || "document",
      fileType: message.message.documentMessage.mimetype || "application/octet-stream",
      fileSize: String(message.message.documentMessage.fileLength || 0),
      isFile: true,
    };
  }
  if (message.message?.stickerMessage) {
    return {
      ...messageBase,
      body: "",
      type: "sticker",
      fileName: "sticker.webp",
      fileType: message.message.stickerMessage.mimetype || "image/webp",
      fileSize: String(message.message.stickerMessage.fileLength || 0),
      isFile: true,
    };
  }

  return {
    ...messageBase,
    type: "unsupported",
    body: "",
    isFile: false,
  };
}

function getMessageContactName(message: WAMessage): string {
  return message.verifiedBizName || message.pushName || message.key.remoteJid?.split("@")[0] || "";
}

function getMessageFrom(key: WAMessageKey): string {
  const isGroup = key.remoteJid?.includes("@g.us");
  const isLid = key.addressingMode === "lid";
  if (isGroup) {
    const participant = key.participant || "";
    const participantAlt = key.participantAlt || participant;
    const phone = isLid ? participantAlt.split("@")[0] : participant.split("@")[0];

    return phone || key.participant || "";
  }
  const jid = key.remoteJid || "";
  const jidAlt = key.remoteJidAlt || jid;
  const phone = isLid ? jidAlt.split("@")[0] : jid.split("@")[0];

  return phone || key.remoteJid || "";
}

function getIsForwarded(message: WAMessage): boolean {
  return message.message?.extendedTextMessage?.contextInfo?.isForwarded || false;
}

function getMessageQuotedId(message: WAMessage): string | null {
  return message.message?.extendedTextMessage?.contextInfo?.stanzaId || null;
}

async function processMediaFile(instance: string, message: WAMessage, content: FileMessageContent) {
  Logger.debug("Downloading media message", { fileName: content.fileName, fileSize: content.fileSize });

  const mediaBuffer = await downloadMediaMessage(message, "buffer", {});

  Logger.debug("Media downloaded, uploading to storage", { bufferSize: mediaBuffer.length });

  const uploadedFile = await filesService.uploadFile({
    buffer: mediaBuffer,
    fileName: content.fileName,
    mimeType: content.fileType,
    dirType: FileDirType.PUBLIC,
    instance,
  });

  return uploadedFile;
}

export default parseMessage;
