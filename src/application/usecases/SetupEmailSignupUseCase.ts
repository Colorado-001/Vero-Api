import { v4 as uuid4 } from "uuid";
import { OtpEntity } from "../../domain/entities";
import { IEmailTemplateParser, INotificationService } from "../../domain/ports";
import { IOtpRepository, IUserRepository } from "../../domain/repositories";
import { EmailSignupOtpData } from "../../types/common";
import { ConflictError } from "../../utils/errors";
import { generateSecureOtp } from "../../utils/helpers";
import { EmailSignupDto } from "../dto";

export class SetupEmailSignupUseCase {
  constructor(
    private readonly otpRepo: IOtpRepository,
    private readonly userRepo: IUserRepository,
    private readonly emailTemplateParser: IEmailTemplateParser,
    private readonly notificationService: INotificationService
  ) {}

  async execute(input: EmailSignupDto): Promise<string> {
    const user = await this.userRepo.findByEmail(input.email);

    if (user) {
      throw new ConflictError("User with email already exist");
    }

    const otpCode = generateSecureOtp(6);
    const token = uuid4();

    const otp = OtpEntity.create<EmailSignupOtpData>(
      otpCode,
      token,
      "emailSignup",
      {
        email: input.email,
      }
    );

    const { body, subject } = await this.emailTemplateParser.getBody(
      "emailSignupOtp",
      {
        code: otpCode,
      }
    );

    await this.otpRepo.save(otp);
    await this.notificationService.sendEmail(body, input.email, subject);

    return token;
  }
}
