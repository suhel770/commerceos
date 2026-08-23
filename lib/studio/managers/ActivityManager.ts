export interface ActivityEvent {
  id?: string;

  type: string;

  title: string;

  description?: string;

  actor?: string;

  timestamp: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export default class ActivityManager {
  private events: ActivityEvent[] =
    [];

  /**
   * Record Activity
   */
  record(
    event: ActivityEvent,
  ): ActivityEvent {
    const activity = {
      ...event,

      id:
        event.id ??
        crypto.randomUUID(),
    };

    /**
     * Latest event first.
     */
    this.events.unshift(
      activity,
    );

    return activity;
  }

  /**
   * Record Bulk Events
   */
  recordMany(
    events: ActivityEvent[],
  ) {
    events.forEach((event) =>
      this.record(event),
    );
  }

  /**
   * Get Timeline
   */
  getTimeline() {
    return [
      ...this.events,
    ];
  }

  /**
   * Latest Event
   */
  latest() {
    return this.events[0] ?? null;
  }

  /**
   * Filter by Type
   */
  byType(type: string) {
    return this.events.filter(
      (event) =>
        event.type === type,
    );
  }

  /**
   * Filter by Actor
   */
  byActor(actor: string) {
    return this.events.filter(
      (event) =>
        event.actor === actor,
    );
  }

  /**
   * Find Event
   */
  find(id: string) {
    return (
      this.events.find(
        (event) =>
          event.id === id,
      ) ?? null
    );
  }

  /**
   * Remove Event
   */
  remove(id: string) {
    this.events =
      this.events.filter(
        (event) =>
          event.id !== id,
      );
  }

  /**
   * Clear Timeline
   */
  clear() {
    this.events = [];
  }

  /**
   * Event Count
   */
  get count() {
    return this.events.length;
  }

  /**
   * Export Timeline
   */
  export() {
    return structuredClone(
      this.events,
    );
  }

  /**
   * Import Timeline
   */
  import(
    events: ActivityEvent[],
  ) {
    this.events =
      structuredClone(events);
  }

  /**
   * Recent Events
   */
  recent(limit = 20) {
    return this.events.slice(
      0,
      limit,
    );
  }

  /**
   * Today's Events
   */
  today() {
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    return this.events.filter(
      (event) =>
        event.timestamp.startsWith(
          today,
        ),
    );
  }

  /**
   * Group Events by Day
   */
  grouped() {
    const groups: Record<
      string,
      ActivityEvent[]
    > = {};

    for (const event of this
      .events) {
      const day =
        event.timestamp.split(
          "T",
        )[0];

      if (!groups[day]) {
        groups[day] = [];
      }

      groups[day].push(event);
    }

    return groups;
  }
}