import { SavingExecutionEventPayloadType } from "../../types/domain-events";
import { DomainEvent } from "./base";

export class SavingExecutionEvent extends DomainEvent<SavingExecutionEventPayloadType> {
  static eventName: string = "SavingExecution";
  protected get aggregateId(): string {
    return this.getPayload().saving.id.toString();
  }
}
