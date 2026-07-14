import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");
  return userId;
}

export async function requireSessionUser(): Promise<string> {
  return requireUserId();
}
