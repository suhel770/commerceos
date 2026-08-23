export type ProductDomainEventType =
  | "ProductCreated"
  | "ProductUpdated"
  | "ProductValidated"
  | "ListingPublished"
  | "InventoryAdjusted"
  | "InventoryReserved"
  | "InventoryReleased"
  | "InventoryTransferred"
  | "OrderCreated"
  | "OrderConfirmed"
  | "OrderAllocated"
  | "OrderCancelled"
  | "OrderHeld"
  | "OrderPicked"
  | "OrderPacked"
  | "OrderShipped"
  | "OrderDelivered"
  | "OrderSettled"
  | "OrderClosed"
  | "OrderReturnOpened"
  | "OrderReturnApproved"
  | "OrderReturnDisposed"
  | "OrderTrackingUpdated"
  | "OrderRtoInitiated"
  | "OrderRtoCompleted"
  | "OrderReturnReceived"
  | "PurchaseVendorCreated"
  | "PurchaseVendorUpdated"
  | "PurchaseBillCreated"
  | "PurchaseBillTransitioned";

export interface ProductDomainEvent<
  TPayload extends Record<
    string,
    unknown
  > = Record<string, unknown>,
> {
  id: string;
  type: ProductDomainEventType;
  organizationId: string;
  workspaceId: string;
  productId: string;
  occurredAt: string;
  payload: TPayload;
}

export interface DomainEventPublisher {
  publish<
    TPayload extends Record<
      string,
      unknown
    >,
  >(
    event: ProductDomainEvent<TPayload>,
  ): Promise<void>;
}

class LocalDomainEventPublisher
  implements DomainEventPublisher
{
  private readonly events:
    ProductDomainEvent[] = [];

  async publish<
    TPayload extends Record<
      string,
      unknown
    >,
  >(
    event: ProductDomainEvent<TPayload>,
  ) {
    this.events.push(
      structuredClone(
        event as ProductDomainEvent,
      ),
    );
  }

  snapshot() {
    return structuredClone(
      this.events,
    );
  }
}

export const domainEvents =
  new LocalDomainEventPublisher();
