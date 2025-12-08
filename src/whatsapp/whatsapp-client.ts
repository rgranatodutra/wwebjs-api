import type { EditMessageOptions, SendMessageOptions, SendTemplateOptions, TemplateMessage } from "./types";
import type MessageDto from "./types";

abstract class WhatsappClient {
  public abstract readonly sessionId: string;

  public abstract isValidWhatsapp(phone: string): Promise<boolean>;
  public abstract sendMessage(props: SendMessageOptions, isGroup?: boolean): Promise<MessageDto>;
  public abstract editMessage(props: EditMessageOptions): Promise<void>;
  public abstract getAvatarUrl(phone: string): Promise<string | null>;
  /*  public abstract forwardMessage(to: string, messageId: string, isGroup: boolean): Promise<void>; */
  //public abstract getTemplates(): Promise<TemplateMessage[]>;
  //public abstract sendTemplate(props: SendTemplateOptions, chatId: number, contactId: number): Promise<MessageDto>;
}

export default WhatsappClient;
