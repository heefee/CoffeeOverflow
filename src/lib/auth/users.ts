import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import type { AuthUser } from "./session";

interface UserRow {
  id: string;
  email: string;
  name: string;
  cnp: string | null;
  provider: "roeid";
  is_mock: boolean;
}

export async function upsertAuthUser(user: AuthUser): Promise<AuthUser> {
  const result = await query<UserRow>(
    `
      INSERT INTO app_users (id, email, name, cnp, provider, is_mock, last_login_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          cnp = COALESCE(EXCLUDED.cnp, app_users.cnp),
          provider = EXCLUDED.provider,
          is_mock = EXCLUDED.is_mock,
          updated_at = NOW(),
          last_login_at = NOW()
      RETURNING id, email, name, cnp, provider, is_mock;
    `,
    [
      user.sub || randomUUID(),
      user.email,
      user.name,
      user.cnp ?? null,
      user.provider,
      user.isMock ?? false,
    ],
  );

  const row = result.rows[0];
  return {
    sub: row.id,
    email: row.email,
    name: row.name,
    cnp: row.cnp ?? undefined,
    provider: row.provider,
    isMock: row.is_mock,
  };
}

export async function createMockUserFromEmail(email: string): Promise<AuthUser> {
  return upsertAuthUser({
    sub: `mock-email:${email}`,
    email,
    name: email.split("@")[0] || "Utilizator demo",
    cnp: "1900101123456",
    provider: "roeid",
    isMock: true,
  });
}
