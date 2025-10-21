import { v4 } from "uuid";
import { DomainEvent } from "../../domain/events/base";
import { IDomainEventBus } from "../../domain/ports";
import { DomainEventSubscription } from "../../types/domain-events";
import { Env } from "../../config/env";
import winston from "winston";
import createLogger from "../../logging/logger.config";

export class InMemoryDomainEventBus implements IDomainEventBus {
  private readonly logger: winston.Logger;

  constructor(config: Env) {
    this.logger = createLogger(InMemoryDomainEventBus.name, config);
  }

  private handlers: Map<
    string,
    Array<(event: DomainEvent) => Promise<void> | void>
  > = new Map();

  private started = false;

  async publish(event: DomainEvent): Promise<void> {
    if (!this.started) {
      throw new Error("Event bus is not started");
    }

    try {
      const eventName = event.eventName;
      const eventHandlers = this.handlers.get(eventName) || [];

      for (const handler of eventHandlers) {
        await handler(event);
      }
    } catch (error: any) {
      this.logger.error("Error publishing event");
      this.logger.error(error?.message || "Unknown Error");
      console.error(error);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void> | void
  ): DomainEventSubscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const handlers = this.handlers.get(eventName)!;
    handlers.push(handler as (event: DomainEvent) => Promise<void> | void);

    const subscription: DomainEventSubscription = {
      id: v4(),
      eventName,
      unsubscribe: () => {
        const index = handlers.indexOf(
          handler as (event: DomainEvent) => Promise<void> | void
        );
        if (index > -1) {
          handlers.splice(index, 1);
        }
      },
    };

    return subscription;
  }

  unsubscribe(subscription: DomainEventSubscription): void {
    subscription.unsubscribe();
  }

  async start(): Promise<void> {
    this.started = true;
    this.logger.debug("Event bus started...");
  }

  async stop(): Promise<void> {
    this.started = false;
    this.handlers.clear();
    this.logger.debug("Event bus stopped...");
  }

  isStarted(): boolean {
    return this.started;
  }

  getSubscribedEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}
