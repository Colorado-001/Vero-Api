import { IEmailTemplateParser } from "../../domain/ports/index.js";
import { EmailTypeDataMapping } from "../../types/email.js";
import { InternalServerError } from "../../utils/errors/index.js";

export class MockEmailTemplateParser implements IEmailTemplateParser {
  async getBody<Key extends keyof EmailTypeDataMapping>(
    key: Key,
    data: EmailTypeDataMapping[Key]
  ) {
    switch (key) {
      case "emailSignupOtp":
        return {
          body: `
        <html>
          <body>
            <h1>Welcome!</h1>
            <p>Your one-time verification code is:</p>
            <h2>${data.code}</h2>
            <p>This code expires in 10 minutes.</p>
          </body>
        </html>
      `,
          subject: "Verification Code",
        };

      default:
        console.info(`Email type: ${key}`);
        throw new InternalServerError("Invalid email type");
    }
  }
}
