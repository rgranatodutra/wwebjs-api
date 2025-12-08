import { proto } from "baileys";

export interface FullRawMessageJson {
  id: number;
  session_id: string;
  remote_jid: string;
  message_id: string;
  from_me: boolean;
  message_data: string; // JSON stringified proto.IMessage
  key_data: string; // JSON stringified proto.IMessageKey
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface FullRawMessage {
  id: number;
  session_id: string;
  remote_jid: string;
  message_id: string;
  from_me: boolean;
  message_data: proto.IMessage;
  key_data: proto.IMessageKey;
  created_at: Date;
  updated_at: Date;
}
