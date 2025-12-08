import { proto, type AuthenticationState, type GroupMetadata, type SignalKeyStore, type WAMessageKey } from "baileys";

abstract class StorageClient {
  public abstract getSignalKeyStore(sessionId: string): Promise<SignalKeyStore>;
  public abstract getGroupMetadata(sessionId: string, jid: string): Promise<GroupMetadata | undefined>;
  public abstract getRawMessage(sessionId: string, key: WAMessageKey): Promise<proto.IMessage | undefined>;
  public abstract saveRawMessage(sessionId: string, message: proto.IMessage, key: WAMessageKey): Promise<void>;
  public abstract getAuthState(sessionId: string): Promise<AuthenticationState>;
  public abstract saveAuthState(sessionId: string): Promise<void>;
  public abstract clearAuthState(sessionId: string): Promise<void>;
  public abstract unsafeQuery<T>(query: string, params?: any[]): Promise<T[]>;
}

export default StorageClient;
