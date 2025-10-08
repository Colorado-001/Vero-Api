import { UserEntity } from "../../domain/entities";
import { IUserRepository, IOtpRepository } from "../../domain/repositories";
import { EmailSignupOtpData } from "../../types/common";
import { BadRequestError, ConflictError } from "../../utils/errors";
import { VerifyEmailSignupDto } from "../dto";
import { JwtService, WalletSetupService } from "../services";

export class VerifyEmailSignupUseCase {
  constructor(
    private readonly otpRepo: IOtpRepository,
    private readonly userRepo: IUserRepository,
    private readonly walletService: WalletSetupService,
    private readonly jwtService: JwtService
  ) {}

  async execute(input: VerifyEmailSignupDto): Promise<string> {
    const otp = await this.otpRepo.findByToken<EmailSignupOtpData>(
      input.token,
      "emailSignup"
    );

    if (!otp || !otp.validate(input.code)) {
      throw new BadRequestError("Invalid or expired otp");
    }

    const existingUser = await this.userRepo.findByEmail(otp.data.email);
    if (existingUser) {
      throw new ConflictError("User already verified");
    }

    const walletData = await this.walletService.execute();

    const newUser = UserEntity.create(
      walletData.privateKey,
      walletData.address,
      walletData.eoaAccount,
      walletData.implementation,
      walletData.isDeployed,
      otp.data.email
    );

    await this.otpRepo.delete(input.token, "emailSignup");
    await this.userRepo.save(newUser);

    return this.jwtService.sign({ sub: newUser.id });
  }
}
