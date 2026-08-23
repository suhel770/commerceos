# Products API v1

Adapter-first Product Studio API. Authorization currently uses the mock Owner
session until production auth is introduced. Every response includes
`requestId`.

## Endpoints

### `GET /api/v1/products`

Lists master products for the current organization and workspace.

Requires: `products.view`

### `GET /api/v1/products/{id}`

Returns one master product.

Requires: `products.view`

### `PATCH /api/v1/products/{id}`

Conflict-safe update. Body must include `revision` and only allowed fields.

Requires: `products.edit`

Conflict: `409 REVISION_CONFLICT` when the provided revision is stale.

### `POST /api/v1/products/{id}/validate`

Runs the shared domain validation service and persists issues.

Requires: `products.view`

### `POST /api/v1/products/{id}/publish`

Façade over the listing engine publish pipeline (queue + simulated marketplace connectors).

Requires: `products.publish`

Headers:
- `Idempotency-Key` (required)
- `x-request-id` (optional)

### Listing engine APIs

#### `GET /api/v1/listings`

Workspace listing index (product × marketplace).

Requires: `products.view`

#### `GET /api/v1/listings/{id}`

Listing record key format: `{productId}:{marketplace}`.

Requires: `products.view`

#### `POST /api/v1/listings/validate`

Body: `{ "productId": "..." }`

Returns master + per-channel readiness scores.

Requires: `products.view`

#### `POST /api/v1/listings/status`

Body: `{ "productId": "..." }`

Returns flowchart Step 7 marketplace status tracking cards (operational status, platform ID, stock, visibility, health).

Requires: `products.view`

#### `POST /api/v1/listings/publish`

Body: `{ "productId": "...", "marketplace?: "amazon" }`

Headers:
- `Idempotency-Key` (required)

Requires: `products.publish`

#### `POST /api/v1/listings/sync`

Body: `{ "productId": "...", "type": "sync_price" | "sync_inventory" | "sync_status", "marketplace?: "..." }`

Requires: `products.edit`

#### `GET /api/v1/listings/errors`

Failed publish/sync jobs (DLQ-style).

`POST /api/v1/listings/errors` with `{ "jobId": "..." }` retries a failed job.

Requires: `products.view` (GET) / `products.publish` (POST retry)

### `POST /api/v1/media/upload-policy`

Validates a secure-upload contract request for Product Studio media.

Requires: `products.edit`

## Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "uuid"
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid.",
    "details": []
  },
  "requestId": "uuid"
}
```
