import { v4 as uuid4 } from "uuid";
import { OTP_EXPIRY_SECONDS } from "../../utils/constants";
import { OtpType } from "../../types/common";

export class OtpEntity {
  private readonly _id: string;
  private _code!: string;
  private _identifier!: string;
  private _token!: string;
  private _type!: OtpType;
  private readonly _createdAt: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id ?? uuid4();
    this._createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  static create(
    code: string,
    identifier: string,
    token: string,
    type: OtpType,
    id?: string,
    createdAt?: Date
  ): OtpEntity {
    const otp = new OtpEntity(id, createdAt);
    otp._code = code;
    otp._identifier = identifier;
    otp._token = token;
    otp._type = type;
    return otp;
  }

  /**
   * Validates the OTP code and expiry.
   * @param code The OTP code to check.
   * @returns true if valid, false otherwise.
   */
  validate(code: string): boolean {
    const now = new Date();
    const diffSeconds = (now.getTime() - this._createdAt.getTime()) / 1000;

    const notExpired = diffSeconds < OTP_EXPIRY_SECONDS;
    const isMatch = this._code === code;

    return notExpired && isMatch;
  }

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get identifier(): string {
    return this._identifier;
  }

  get token(): string {
    return this._token;
  }

  get type(): OtpType {
    return this._type;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
