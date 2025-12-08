import { ConnectionState, DisconnectReason } from "baileys";
import ProcessingLogger from "../../../../utils/processing-logger";
import BaileysWhatsappClient from "./baileys-whatsapp-client";
import makeNewSocket from "./make-new-socket";

interface ConnectionUpdateContext {
  update: Partial<ConnectionState>;
  client: BaileysWhatsappClient;
  logger: ProcessingLogger;
}

async function handleConnectionUpdate({ update, client, logger }: ConnectionUpdateContext) {
  logger.log("Connection update received", update);

  if (update.qr) {
    client._ev.emit({
      type: "qr-received",
      clientId: client.clientId,
      qr: update.qr,
    });

    logger.log("QR code generated for connection");
  }

  if (update.connection === "open") {
    logger.log("Connection opened successfully");
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(Date.now() - sevenDays);
    client._sock.fetchMessageHistory(10, {}, sevenDaysAgo.getTime());
    client._phone = client._sock.user?.id.split(":")[0] || "";

    client._ev.emit({
      type: "auth-success",
      clientId: client.clientId,
      phoneNumber: client._phone,
    });
  }

  const errStatusCode = (update.lastDisconnect?.error as any)?.output?.statusCode;
  const isRestartRequired = errStatusCode === DisconnectReason.restartRequired;

  if (update.connection === "close" && isRestartRequired) {
    logger.log("Socket restart required, reinitializing...");
    client._sock = await makeNewSocket(client.sessionId, client._storage);
    client.bindEvents();
    logger.log("Socket reinitialized successfully");
  }
  if (update.connection === "close" && !isRestartRequired) {
    client._storage.clearAuthState(client.sessionId);
    logger.log("Logged out, cleared auth state from storage");
    client._sock = await makeNewSocket(client.sessionId, client._storage);
    client.bindEvents();
    logger.log("Socket reinitialized after logout");
  }
}

export default handleConnectionUpdate;
