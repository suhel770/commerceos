import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AuthorizationError,
  authorize,
} from "./authorization";
import { createMockCommerceContext } from "./commerce-context";

describe("authorize", () => {
  it("allows the mock owner through the same policy boundary", () => {
    const context =
      createMockCommerceContext(
        "request-test",
      );

    expect(() =>
      authorize(
        context,
        "products.publish",
      ),
    ).not.toThrow();
  });

  it("denies missing permissions by default", () => {
    const context = {
      ...createMockCommerceContext(
        "request-test",
      ),
      actor: {
        ...createMockCommerceContext()
          .actor,
        permissions: [],
      },
    };

    expect(() =>
      authorize(
        context,
        "products.edit",
      ),
    ).toThrow(
      AuthorizationError,
    );
  });
});
