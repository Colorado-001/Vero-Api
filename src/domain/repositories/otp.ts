import { OtpEntity } from "../entities/otp.entity";
import { OtpType } from "../../types/common";

export interface IOtpRepository {
  save<Data extends object | undefined>(otp: OtpEntity<Data>): Promise<void>;
  findByToken<Data extends object | undefined>(
    token: string,
    type: OtpType
  ): Promise<OtpEntity<Data> | null>;
  delete(token: string, type: OtpType): Promise<void>;
}
