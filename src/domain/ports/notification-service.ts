export interface INotificationService {
  sendEmail(
    body: string,
    to: string | string[],
    subject: string
  ): Promise<void>;
}
