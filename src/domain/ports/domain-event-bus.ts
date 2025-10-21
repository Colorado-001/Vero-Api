import { DomainEventSubscription } from "../../types/domain-events";
import { DomainEvent } from "../events/base";

export interface IDomainEventBus {
  publish(event: DomainEvent): Promise<void> | void;
  publishAll(events: DomainEvent[]): Promise<void> | void;
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void> | void
  ): DomainEventSubscription;
  unsubscribe(subscription: DomainEventSubscription): void;
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}
