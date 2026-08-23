interface IdempotencyRecord<T> {
  scope: string;
  value: T;
  createdAt: number;
}

export class IdempotencyConflictError extends Error {
  readonly code =
    "IDEMPOTENCY_CONFLICT";

  constructor() {
    super(
      "Idempotency key was already used for another operation.",
    );
    this.name =
      "IdempotencyConflictError";
  }
}

class LocalIdempotencyStore {
  private readonly records =
    new Map<
      string,
      IdempotencyRecord<unknown>
    >();

  async execute<T>(
    key: string,
    scope: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const existing =
      this.records.get(key);

    if (existing) {
      if (
        existing.scope !== scope
      ) {
        throw new IdempotencyConflictError();
      }

      return structuredClone(
        existing.value as T,
      );
    }

    const value =
      await operation();

    this.records.set(key, {
      scope,
      value:
        structuredClone(value),
      createdAt: Date.now(),
    });

    return value;
  }
}

export const idempotencyStore =
  new LocalIdempotencyStore();
