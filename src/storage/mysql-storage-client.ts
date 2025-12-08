import {
  makeCacheableSignalKeyStore,
  type AuthenticationState,
  type GroupMetadata,
  type proto,
  type SignalKeyStore,
  type WAMessageKey,
} from "baileys";
import type { ILogger } from "baileys/lib/Utils/logger.js";
import { useMySQLAuthState } from "mysql-baileys";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createPool } from "mysql2/promise";
import type StorageClient from "./storage-client.js";
import { Logger } from "@in.pulse-crm/utils";

type MySQLAuthState = Awaited<ReturnType<typeof useMySQLAuthState>>;

class MySQLStorageClient implements StorageClient {
  private pool: Pool;
  private mysqlAuthStateMap: Map<string, MySQLAuthState> = new Map();

  constructor(
    private host: string,
    private port: number,
    private user: string,
    private password: string,
    private database: string,
  ) {
    this.pool = createPool({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.database,
    });
  }

  private async getMysqlAuthState(sessionId: string) {
    if (!this.mysqlAuthStateMap.has(sessionId)) {
      const mysqlAuthState = await useMySQLAuthState({
        session: sessionId,
        database: this.database,
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password,
      });
      this.mysqlAuthStateMap.set(sessionId, mysqlAuthState);
    }
    return this.mysqlAuthStateMap.get(sessionId)!;
  }

  public async getSignalKeyStore(sessionId: string, logger?: ILogger) {
    const { state } = await this.getMysqlAuthState(sessionId);
    return makeCacheableSignalKeyStore(state.keys as SignalKeyStore, logger);
  }

  public async getGroupMetadata(sessionId: string, jid: string): Promise<GroupMetadata | undefined> {
    const query = "SELECT data FROM group_metadata WHERE jid = ? AND session_id = ?";
    const [rows] = await this.pool.query<RowDataPacket[]>(query, [jid, sessionId]);

    if (rows[0]) {
      return JSON.parse(rows[0]["data"]) as GroupMetadata;
    }

    return undefined;
  }

  public async getRawMessage(sessionId: string, key: WAMessageKey): Promise<proto.IMessage | undefined> {
    try {
      const query = "SELECT message_data FROM raw_messages WHERE id = ? AND session_id = ?";
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [key.id, sessionId]);

      if (rows[0]) {
        const messageData = rows[0]["message_data"];
        return typeof messageData === "string" ? JSON.parse(messageData) : messageData;
      }

      return undefined;
    } catch (error: any) {
      return undefined;
    }
  }

  public async saveRawMessage(sessionId: string, message: proto.IMessage, key: WAMessageKey): Promise<void> {
    try {
      const query = `
        INSERT INTO raw_messages (session_id, remote_jid, message_id, message_data, key_data, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          message_data = VALUES(message_data),
          updated_at = NOW()
      `;

      await this.pool.query(query, [sessionId, key.remoteJid, key.id, JSON.stringify(message), JSON.stringify(key)]);
    } catch (error: any) {
      Logger.error("Error saving raw message", error);
    }
  }

  public async getAuthState(sessionId: string) {
    const { state } = await this.getMysqlAuthState(sessionId);

    return state as AuthenticationState;
  }

  public async saveAuthState(sessionId: string) {
    const { saveCreds } = await this.getMysqlAuthState(sessionId);

    await saveCreds();
  }

  public async clearAuthState(sessionId: string) {
    const { clear, removeCreds } = await this.getMysqlAuthState(sessionId);

    await clear();
    await removeCreds();
  }

  public async unsafeQuery<T>(query: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(query, params);
    return rows as T[];
  }
}

export default MySQLStorageClient;
