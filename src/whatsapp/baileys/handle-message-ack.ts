import ProcessingLogger from "../../utils/processing-logger";
import parseAck from "./parse-ack";

interface MessageAckContext {
  logger: ProcessingLogger;
  msgId: string;
  ack: number;
}

async function handleMessageAck({ logger, msgId, ack }: MessageAckContext) {
  const status = parseAck(ack);
  logger.log(`Message with ID ${msgId} updated with status: ${status}`);
}

export default handleMessageAck;
