import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  assertOwnedRecord,
  requireUserId,
} from "./ownership";

describe("ownership guards", () => {
  it("requires an authenticated user id", () => {
    expect(() => requireUserId(undefined)).toThrow(AuthorizationError);
    expect(requireUserId("user-a")).toBe("user-a");
  });

  it("returns an owned record", () => {
    const record = { id: "project-1", userId: "user-a" };
    expect(assertOwnedRecord(record)).toEqual(record);
  });

  it("does not reveal whether a foreign record exists", () => {
    expect(() => assertOwnedRecord(undefined)).toThrow(
      "Resource not found or access denied.",
    );
  });
});
