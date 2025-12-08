import { Logger } from "@in.pulse-crm/utils";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  MessageUpsertType,
  WAMessage,
  WAMessageUpdate,
  type ConnectionState,
} from "baileys";
import type { ILogger } from "baileys/lib/Utils/logger";
import QRCode from "qrcode";
import ProcessingLogger from "../../../../utils/processing-logger";
import type DataClient from "../../../data/data-client";
import type MessageDto from "../../types";
import type { EditMessageOptions, SendMessageOptions } from "../../types";
import WhatsappClient from "../whatsapp-client";
import handleMessageUpdate from "./handle-message-update";
import handleMessageUpsert from "./handle-message-upsert";

class BaileysWhatsappClient implements WhatsappClient {
  private _phone: string = "";
  
  constructor(
    public readonly sessionId: string,
    public readonly clientId: number,
    public readonly instance: string,
    public readonly _storage: DataClient,
    private _sock: ReturnType<typeof makeWASocket>,
  ) {}

  public static async build(
    sessionId: string,
    clientId: number,
    instance: string,
    storage: DataClient,
  ): Promise<BaileysWhatsappClient> {
    const socket = await BaileysWhatsappClient.makeNewSocket(sessionId, storage);

    const client = new BaileysWhatsappClient(sessionId, clientId, instance, storage, socket);
    client.bindEvents();
    return client;
  }

  private static async makeNewSocket(id: string, storage: DataClient) {
    const logger: ILogger = {
      level: "info",
      error: (msg) => console.log(`[ERROR] ${msg}`),
      warn: (msg) => console.log(`[WARN] ${msg}`),
      info: (msg) => console.log(`[INFO] ${msg}`),
      child: (msg) => {
        console.log(`[CHILD LOGGER] ${msg}`);
        return logger;
      },
      debug: () => {},
      trace: () => {},
    };

    const authState = await storage.getAuthState(id);
    const signalStore = await storage.getSignalKeyStore(id);
    const socket = makeWASocket({
      logger,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(signalStore, logger),
      },
      browser: Browsers.windows("Google Chrome"),
      cachedGroupMetadata: async (jid) => storage.getGroupMetadata(id, jid),
      getMessage: async (key) => storage.getRawMessage(id, key),
    });

    return socket;
  }

  private bindEvents() {
    this._sock.ev.on("connection.update", this.onConnectionUpdate.bind(this));
    this._sock.ev.on("creds.update", this._storage.saveAuthState.bind(this._storage, this.sessionId));
    this._sock.ev.on("messages.upsert", this.onMessagesUpsert.bind(this));
    this._sock.ev.on("messages.update", this.onMessagesUpdate.bind(this));
    this._sock.ev.on("messaging-history.set", this.onHistorySet.bind(this));
  }

  private getLogger(processName: string, processId: string, input: unknown, debug: boolean = false): ProcessingLogger {
    return new ProcessingLogger(this._storage, this.instance, processName, processId, input, debug);
  }

  private async onConnectionUpdate(update: Partial<ConnectionState>) {
    const logger = this.getLogger("Connection Update", `conn-update-${Date.now()}`, update);
    Logger.info("Connection update received:");
    console.dir(update, { depth: null });

    logger?.log("Connection update received", update);

    if (update.qr) {
      const qrString = await QRCode.toString(update.qr, { type: "terminal" });
      console.log(qrString);
      logger?.log("QR code generated for connection");
    }

    if (update.connection === "open") {
      logger.log("Connection opened successfully");
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = new Date(Date.now() - sevenDays);
      this._sock.fetchMessageHistory(10, {}, sevenDaysAgo.getTime());
      this._phone = this._sock.user?.id.split(":")[0] || "";
    }

    if (
      update.connection === "close" &&
      (update.lastDisconnect?.error as any)?.output?.statusCode === DisconnectReason.restartRequired
    ) {
      logger?.log("Socket restart required, reinitializing...");
      this._sock = await BaileysWhatsappClient.makeNewSocket(this.sessionId, this._storage);
      this.bindEvents();
      logger?.log("Socket reinitialized successfully");
    } else if (update.connection === "close") {
      this._storage.clearAuthState(this.sessionId);
      logger?.log("Logged out, cleared auth state from storage");
      // Additional handling for logged out state can be added here
      // Reconnect
      this._sock = await BaileysWhatsappClient.makeNewSocket(this.sessionId, this._storage);
      this.bindEvents();
      logger?.log("Socket reinitialized after logout");
    }
  }

  private async onMessagesUpsert({ messages, type }: { messages: WAMessage[]; type: MessageUpsertType }) {
    const processId = `messages-upsert-${Date.now()}`;
    const logger = this.getLogger("Messages Upsert", processId, { type, messageCount: messages.length });

    await handleMessageUpsert({ messages, type, client: this, logger });
  }

  private async onMessagesUpdate(updates: WAMessageUpdate[]) {
    const processId = `messages-update-${Date.now()}`;
    const logger = this.getLogger("Messages Update", processId, { updateCount: updates.length });

    await handleMessageUpdate({ updates, client: this, logger });
  }

  private async onHistorySet({ messages }: { messages: WAMessage[] }) {
    const processId = `history-set-${Date.now()}`;
    const logger = this.getLogger("History Set", processId, { messageCount: messages.length }, true);

    try {
      logger.log(`Received messaging history set`, { messageCount: messages.length });

      for (const message of messages) {
        if (message.message) {
          logger?.log("Saving raw message from history", { messageId: message.key?.id });

          await this._storage.saveRawMessage(this.sessionId, message.message, message.key);
        }
      }

      logger.success({ savedMessages: messages.length });
    } catch (error) {
      logger.failed(error);
      throw error;
    }
  }

  public isValidWhatsapp(phone: string): Promise<boolean> {
    const processId = `validate-whatsapp-${Date.now()}`;
    const logger = this.getLogger("Validate WhatsApp", processId, { phone });

    logger.log(`Checking if phone number is valid WhatsApp: ${phone}`);
    throw new Error("Method not implemented.");
  }

  public sendMessage(props: SendMessageOptions, isGroup?: boolean): Promise<MessageDto> {
    const processId = `send-message-${Date.now()}`;
    const logger = this.getLogger("Send Message", processId, { props, isGroup });

    logger.log(`Sending message to ${isGroup ? "group" : "individual"}: ${props.to}`, props);
    throw new Error("Method not implemented.");
  }

  public editMessage(props: EditMessageOptions): Promise<void> {
    const processId = `edit-message-${Date.now()}`;
    const logger = this.getLogger("Edit Message", processId, { props });

    logger.log(`Editing message with ID: ${props.messageId}`, props);
    throw new Error("Method not implemented.");
  }

  public getAvatarUrl(phone: string): Promise<string | null> {
    const processId = `get-avatar-${Date.now()}`;
    const logger = this.getLogger("Get Avatar URL", processId, { phone });

    logger.log(`Getting avatar URL for phone number: ${phone}`);
    throw new Error("Method not implemented.");
  }

  get phone(): string {
    return this._phone;
  }
}

export default BaileysWhatsappClient;
