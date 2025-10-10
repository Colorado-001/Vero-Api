import {
  IUserRepository,
  IOtpRepository,
} from "../../domain/repositories/index.js";
import { EmailSignupOtpData } from "../../types/common.js";
import { BadRequestError, NotFoundError } from "../../utils/errors/index.js";
import { VerifyEmailSignupDto } from "../dto/index.js";
import { JwtService } from "../services/index.js";

export class VerifyLoginUseCase {
  constructor(
    private readonly otpRepo: IOtpRepository,
    private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService
  ) {}

  async execute(input: VerifyEmailSignupDto): Promise<string> {
    const otp = await this.otpRepo.findByToken<EmailSignupOtpData>(
      input.token,
      "login"
    );

    if (!otp || !otp.validate(input.code)) {
      throw new BadRequestError("Invalid or expired otp");
    }

    const user = await this.userRepo.findByEmail(otp.data.email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.otpRepo.delete(input.token, "emailSignup");

    return this.jwtService.sign({ sub: user.id });
  }
}
