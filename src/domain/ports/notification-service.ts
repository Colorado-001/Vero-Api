import { EmailTypeDataMapping } from "../../types/common";

export interface INotificationService {
  sendEmail(
    body: string,
    to: string | string[],
    subject: string
  ): Promise<void>;
}
