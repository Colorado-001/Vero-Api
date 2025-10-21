import { v4 } from "uuid";

export abstract class DomainEvent<T extends object = object> {
  private readonly eventId: string;
  private readonly occurredOn: Date;
  private readonly version: number = 1;

  public abstract get eventName(): string;
  protected abstract get aggregateId(): string;

  constructor(private readonly payload: T) {
    this.eventId = v4();
    this.occurredOn = new Date();
  }

  getEventId(): string {
    return this.eventId;
  }

  getOccurredOn(): Date {
    return this.occurredOn;
  }

  getVersion(): number {
    return this.version;
  }

  getPayload(): T {
    return this.payload;
  }

  toJSON(): object {
    return {
      eventName: this.eventName,
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      version: this.version,
      aggregateId: this.aggregateId,
      payload: this.payload,
    };
  }
}
