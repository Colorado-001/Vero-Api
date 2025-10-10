import { EmailTypeDataMapping } from "../../types/email.js";

export interface IEmailTemplateParser {
  getBody<Key extends keyof EmailTypeDataMapping>(
    key: Key,
    data: EmailTypeDataMapping[Key]
  ): Promise<{ body: string; subject: string }>;
}
