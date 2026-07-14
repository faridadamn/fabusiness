import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new AuthorizationError("Authentication is required.");
  }

  return userId;
}

/**
 * Mandatory filter for every query against user-owned records.
 * Pass deletedAt for entities using soft deletion.
 */
export function ownedBy(
  userIdColumn: PgColumn,
  userId: string,
  deletedAtColumn?: PgColumn,
): SQL {
  const ownerFilter = eq(userIdColumn, requireUserId(userId));

  return deletedAtColumn
    ? and(ownerFilter, isNull(deletedAtColumn))!
    : ownerFilter;
}

export function assertRecordOwner(
  recordUserId: string | null | undefined,
  sessionUserId: string | null | undefined,
): void {
  const authenticatedUserId = requireUserId(sessionUserId);

  if (!recordUserId || recordUserId !== authenticatedUserId) {
    // Keep the same response for absent and foreign records to avoid enumeration.
    throw new AuthorizationError("Resource not found or access denied.");
  }
}

export function assertOwnedRecord<T>(record: T | undefined | null): T {
  if (!record) {
    // Do not reveal whether another user's record exists.
    throw new AuthorizationError("Resource not found or access denied.");
  }

  return record;
}