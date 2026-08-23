/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Universal Domain Event Bus Engine (EventBusEngine)
 */

export type DomainEventActor = {
  userId: string;
  role: string;
};

export type DomainEventInput<T = any> = {
  eventId?: string;
  eventType?: string;
  type?: string;
  eventVersion?: number;
  timestamp?: string;
  tenantId?: string;
  producer?: string;
  correlationId?: string;
  actor?: Partial<DomainEventActor>;
  payload: T;
};

export type DomainEvent<T = any> = {
  eventId: string;
  eventType: string;
  type?: string;
  eventVersion: number;
  timestamp: string;
  tenantId: string;
  producer: string;
  correlationId?: string;
  actor: DomainEventActor;
  payload: T;
};

export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBusEngine {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLog: DomainEvent[] = [];

  public async publish<T = any>(input: DomainEventInput<T>): Promise<void> {
    const eventType = input.eventType ?? input.type ?? "DomainEvent";
    const fullEvent: DomainEvent<T> = {
      eventId: input.eventId ?? `evt-${crypto.randomUUID().slice(0, 8)}`,
      eventType,
      type: eventType,
      eventVersion: input.eventVersion ?? 1,
      timestamp: input.timestamp ?? new Date().toISOString(),
      tenantId: input.tenantId ?? "org-commerceos",
      producer: input.producer ?? "CommerceOS",
      correlationId: input.correlationId,
      actor: {
        userId: input.actor?.userId ?? "system",
        role: input.actor?.role ?? "system",
      },
      payload: input.payload,
    };

    this.eventLog.push(fullEvent);
    const subscribers = this.handlers.get(eventType) ?? [];
    for (const handler of subscribers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.error(`[EventBus] Error handling event ${eventType}:`, err);
      }
    }
  }

  public subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
    return () => {
      const updated = (this.handlers.get(eventType) ?? []).filter((h) => h !== handler);
      this.handlers.set(eventType, updated);
    };
  }

  public getLog(): ReadonlyArray<DomainEvent> {
    return this.eventLog;
  }
}

export const eventBus = new EventBusEngine();
