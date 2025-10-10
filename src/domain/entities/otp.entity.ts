import { v4 as uuid4 } from "uuid";
import { OTP_EXPIRY_SECONDS } from "../../utils/constants.js";
import { OtpType } from "../../types/common.js";

export class OtpEntity<Data extends object | undefined> {
  private readonly _id: string;
  private _code!: string;
  private _data!: Data;
  private _token!: string;
  private _type!: OtpType;
  private readonly _createdAt: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id ?? uuid4();
    this._createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  static create<Data extends object | undefined>(
    code: string,
    token: string,
    type: OtpType,
    data: Data,
    id?: string,
    createdAt?: Date
  ): OtpEntity<Data> {
    const otp = new OtpEntity<Data>(id, createdAt);
    otp._code = code;
    otp._data = data;
    otp._token = token;
    otp._type = type;
    return otp;
  }

  isExpired(): boolean {
    const now = new Date();
    const diffSeconds = (now.getTime() - this._createdAt.getTime()) / 1000;

    const notExpired = diffSeconds < OTP_EXPIRY_SECONDS;

    return !notExpired;
  }

  /**
   * Validates the OTP code and expiry.
   * @param code The OTP code to check.
   * @returns true if valid, false otherwise.
   */
  validate(code: string): boolean {
    const isMatch = this._code === code;

    return !this.isExpired() && isMatch;
  }

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get data(): Data {
    return this._data;
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
