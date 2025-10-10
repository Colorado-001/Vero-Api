import { v4 as uuid4 } from "uuid";
import { OtpEntity } from "../../domain/entities/index.js";
import {
  IEmailTemplateParser,
  INotificationService,
} from "../../domain/ports/index.js";
import {
  IOtpRepository,
  IUserRepository,
} from "../../domain/repositories/index.js";
import { EmailSignupOtpData } from "../../types/common.js";
import { NotFoundError } from "../../utils/errors/index.js";
import { generateSecureOtp } from "../../utils/helpers.js";
import { EmailSignupDto } from "../dto/index.js";

export class LoginUseCase {
  constructor(
    private readonly otpRepo: IOtpRepository,
    private readonly userRepo: IUserRepository,
    private readonly emailTemplateParser: IEmailTemplateParser,
    private readonly notificationService: INotificationService
  ) {}

  async execute(input: EmailSignupDto): Promise<string> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const otpCode = generateSecureOtp(6);
    const token = uuid4();

    const otp = OtpEntity.create<EmailSignupOtpData>(otpCode, token, "login", {
      email: input.email,
    });

    const { body, subject } = await this.emailTemplateParser.getBody(
      "loginOtp",
      {
        code: otpCode,
      }
    );

    await this.otpRepo.save(otp);
    await this.notificationService.sendEmail(body, input.email, subject);

    return token;
  }
}
