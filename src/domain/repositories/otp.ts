import { OtpEntity } from "../entities/otp.entity";
import { OtpType } from "../../types/common";

export interface IOtpRepository {
  save(otp: OtpEntity): Promise<void>;
  findByToken(token: string, type: OtpType): Promise<OtpEntity | null>;
  delete(token: string, type: OtpType): Promise<void>;
}
