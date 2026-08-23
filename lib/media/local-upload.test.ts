import { describe, expect, it } from "vitest";

import {
  isAcceptedMediaMimeType,
  mediaKindFromMimeType,
  validateMediaFile,
} from "./local-upload";

describe("local-upload", () => {
  it("accepts supported mime types", () => {
    expect(isAcceptedMediaMimeType("image/png")).toBe(true);
    expect(isAcceptedMediaMimeType("video/mp4")).toBe(true);
    expect(isAcceptedMediaMimeType("text/plain")).toBe(false);
  });

  it("maps mime types to media kinds", () => {
    expect(mediaKindFromMimeType("image/jpeg")).toBe("image");
    expect(mediaKindFromMimeType("video/mp4")).toBe("video");
    expect(mediaKindFromMimeType("application/pdf")).toBe("document");
  });

  it("validates file size and type", () => {
    const valid = new File(["abc"], "hero.png", {
      type: "image/png",
    });
    const invalidType = new File(["abc"], "notes.txt", {
      type: "text/plain",
    });

    expect(validateMediaFile(valid)).toBeNull();
    expect(validateMediaFile(invalidType)).toContain("unsupported type");
  });
});
