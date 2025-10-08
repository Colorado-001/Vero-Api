import { INotificationService } from "../../domain/ports";

export class MockNotificationService implements INotificationService {
  async sendEmail(
    body: string,
    to: string | string[],
    subject: string
  ): Promise<void> {
    const recipients = Array.isArray(to) ? to.join(", ") : to;
    console.log("📧 Sending email to:", recipients, "Subject:", subject);
    console.log("---- Email Body Start ----");
    console.log(body);
    console.log("---- Email Body End ----");
  }
}
