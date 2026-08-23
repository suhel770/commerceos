import { describe, expect, it } from "vitest";

import { canTransition } from "./state-machine";

describe("listing job state machine", () => {
  it("allows the Bible publish pipeline", () => {
    expect(canTransition("draft", "validated")).toBe(true);
    expect(canTransition("validated", "queued")).toBe(true);
    expect(canTransition("queued", "publishing")).toBe(true);
    expect(canTransition("publishing", "published")).toBe(true);
    expect(canTransition("publishing", "failed")).toBe(true);
    expect(canTransition("failed", "queued")).toBe(true);
  });

  it("rejects illegal transitions", () => {
    expect(canTransition("draft", "published")).toBe(false);
    expect(canTransition("published", "failed")).toBe(false);
  });
});
