import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  assertOwnedRecord,
  assertRecordOwner,
  requireUserId,
} from "./ownership";

describe("ownership guards", () => {
  it("requires an authenticated user id", () => {
    expect(() => requireUserId(undefined)).toThrow(AuthorizationError);
    expect(requireUserId("user-a")).toBe("user-a");
  });

  it("accepts a record owned by the authenticated user", () => {
    expect(() => assertRecordOwner("user-a", "user-a")).not.toThrow();
  });

  it("rejects a record owned by another user without revealing its existence", () => {
    expect(() => assertRecordOwner("user-b", "user-a")).toThrow(
      "Resource not found or access denied.",
    );
  });

  it("rejects ownership checks without a session", () => {
    expect(() => assertRecordOwner("user-a", undefined)).toThrow(
      "Authentication is required.",
    );
  });

  it("returns a record already fetched through an ownership-filtered query", () => {
    const record = { id: "project-1", userId: "user-a" };
    expect(assertOwnedRecord(record)).toEqual(record);
  });

  it("does not reveal whether an absent or foreign record exists", () => {
    expect(() => assertOwnedRecord(undefined)).toThrow(
      "Resource not found or access denied.",
    );
  });
});