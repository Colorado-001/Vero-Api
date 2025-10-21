import { v4 as uuid4 } from "uuid";
import { OtpEntity } from "../../domain/entities/index.js";
import { IDomainEventBus } from "../../domain/ports/index.js";
import {
  IOtpRepository,
  IUserRepository,
} from "../../domain/repositories/index.js";
import { EmailSignupOtpData } from "../../types/common.js";
import { NotFoundError } from "../../utils/errors/index.js";
import { generateSecureOtp } from "../../utils/helpers.js";
import { EmailSignupDto } from "../dto/index.js";
import { SendVerifyOtpEvent } from "../../domain/events/send-verify-otp.js";

export class LoginUseCase {
  constructor(
    private readonly otpRepo: IOtpRepository,
    private readonly userRepo: IUserRepository,
    private readonly domainEventBus: IDomainEventBus
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

    await this.otpRepo.save(otp);

    const event = new SendVerifyOtpEvent({
      action: "login",
      code: otpCode,
      identifier: input.email,
      identifierType: "email",
      userId: user.id,
    });
    this.domainEventBus.publish(event);

    return token;
  }
}
