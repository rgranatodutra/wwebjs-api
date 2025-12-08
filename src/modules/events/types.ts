import MessageDto from "../whatsapp/types";

export interface QRReceivedEvent {
  type: "qr-received";
  clientId: number;
  qr: string;
}

export interface AuthSuccessEvent {
  type: "auth-success";
  clientId: number;
  phoneNumber: string;
}

export interface MessageReceivedEvent {
  type: "message-received";
  message: MessageDto;
}

export interface MessageStatusReceivedEvent {
  type: "message-status-received";
  messageId: string;
  status: string;
  timestamp: number;
}

export type WppEvent = QRReceivedEvent | AuthSuccessEvent | MessageReceivedEvent | MessageStatusReceivedEvent;
