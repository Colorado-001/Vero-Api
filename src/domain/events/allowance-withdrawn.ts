import { AllowanceWithdrawnPayloadType } from "../../types/domain-events";
import { DomainEvent } from "./base";

export class AllowanceWithdrawnEvent extends DomainEvent<AllowanceWithdrawnPayloadType> {
  static eventName: string = "AllowanceWithdrawn";

  protected get aggregateId(): string {
    return this.getPayload().ownerUserId;
  }
}
