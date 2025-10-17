import { IUserRepository } from "../../domain/repositories/index.js";
import { NotFoundError } from "../../utils/errors/index.js";
import { UserDto } from "../dto/index.js";
import { QrGeneratorService } from "../services/qr-generator-service.js";

export class GetUserByIdUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly qrGenService: QrGeneratorService
  ) {}

  async execute(id: string): Promise<UserDto> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    if (!user.qrDataUrl) {
      const qr = await this.qrGenService.generateCryptoAddressQR(
        user.smartAccountAddress
      );

      if (qr) {
        user.update({ qrDataUrl: qr.dataUrl });
        await this.userRepo.save(user);
      }
    }

    return {
      id: user.id,
      address: user.smartAccountAddress,
      deployed: user.deployed,
      email: user.email,
      enabled: user.deployed,
      implementation: user.implementation,
      username: user.username,
      pinSetup: user.pinSetup,
      qr: user.qrDataUrl,
    };
  }
}
