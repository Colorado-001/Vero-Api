import { AllowanceWithdrawnPayloadType } from "../../types/domain-events";
import { DomainEvent } from "./base";

export class AllowanceWithdrawnEvent extends DomainEvent<AllowanceWithdrawnPayloadType> {
  public get eventName(): string {
    return "AllowanceWithdrawn";
  }

  protected get aggregateId(): string {
    return this.getPayload().ownerUserId;
  }
}
