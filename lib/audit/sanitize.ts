/**
 * CommerceOS Phase 5 — Payload Sanitizer
 *
 * Strips any field that could contain a secret before writing to
 * OutboxEvent, BackgroundJob, or AuditLog records.
 *
 * Rule: NEVER store passwords, API keys, tokens, or payment secrets
 * in any event, job, or audit payload.
 */

const SECRET_FIELD_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /apiKey/i,
  /api_key/i,
  /accessToken/i,
  /access_token/i,
  /refreshToken/i,
  /refresh_token/i,
  /clientSecret/i,
  /client_secret/i,
  /privateKey/i,
  /private_key/i,
  /cvv/i,
  /cardNumber/i,
  /card_number/i,
  /authorization/i,
  /bearer/i,
  /token/i,
];

function isSecretKey(key: string): boolean {
  return SECRET_FIELD_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Deep-clone a payload object, replacing any value whose key matches
 * a secret pattern with "[REDACTED]".
 *
 * Handles nested objects and arrays.
 */
export function sanitizePayload(
  payload: unknown,
  depth = 0
): Record<string, unknown> {
  if (depth > 10 || payload === null || typeof payload !== "object") {
    return {};
  }

  if (Array.isArray(payload)) {
    // Arrays of objects: sanitize each element
    return { items: payload.map((item) => sanitizePayload(item, depth + 1)) };
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (isSecretKey(key)) {
      result[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizePayload(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}
