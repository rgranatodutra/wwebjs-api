import { MessageStatus } from "../../types";

const ACKS_DICT: Array<MessageStatus> = ["ERROR", "PENDING", "SENT", "RECEIVED", "READ", "READ"];

function parseAck(ack: number): MessageStatus {
  return ACKS_DICT[ack] || "ERROR";
}

export default parseAck;
