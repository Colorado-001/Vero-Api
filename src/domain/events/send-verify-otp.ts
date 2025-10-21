import { SendVerifyOtpPayloadType } from "../../types/domain-events";
import { DomainEvent } from "./base";

export class SendVerifyOtpEvent extends DomainEvent<SendVerifyOtpPayloadType> {
  public get eventName(): string {
    return "SendVerifyOtp";
  }

  protected get aggregateId(): string {
    return this.getPayload().userId;
  }
}
