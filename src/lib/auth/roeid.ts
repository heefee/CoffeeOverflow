import type { NextRequest } from "next/server";
import { createRandomToken, type AuthUser } from "./session";

export const ROEID_STATE_COOKIE = "eavizat_roeid_state";
export const ROEID_NONCE_COOKIE = "eavizat_roeid_nonce";

interface OidcConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
}

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

type Claims = Record<string, unknown>;

export function isMockRoeidEnabled(): boolean {
  return process.env.MOCK_ROEID === "true";
}

export function createMockRoeidUser(): AuthUser {
  return {
    sub: "mock-roeid-user-001",
    name: "Andrei Popescu",
    email: "andrei.popescu.demo@example.test",
    cnp: "1900101123456",
    provider: "roeid",
    isMock: true,
  };
}

export function createOidcState() {
  return {
    state: createRandomToken(),
    nonce: createRandomToken(),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when MOCK_ROEID is not true`);
  return value;
}

function getIssuer(): string {
  return requiredEnv("ROEID_ISSUER").replace(/\/$/, "");
}

function getRedirectUri(request: NextRequest): string {
  return (
    process.env.ROEID_REDIRECT_URI ??
    new URL("/api/auth/roeid/callback", request.nextUrl.origin).toString()
  );
}

function getScope(): string {
  return process.env.ROEID_SCOPE ?? "openid profile email";
}

export function getSafeReturnTo(request: NextRequest): string {
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return "/harta";
}

async function discoverOidcConfiguration(): Promise<OidcConfiguration> {
  const issuer = getIssuer();
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ROeID discovery failed with status ${response.status}`);
  }

  return (await response.json()) as OidcConfiguration;
}

export async function buildRoeidAuthorizationUrl(
  request: NextRequest,
  state: string,
  nonce: string,
): Promise<string> {
  const discovery = await discoverOidcConfiguration();
  const url = new URL(discovery.authorization_endpoint);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", requiredEnv("ROEID_CLIENT_ID"));
  url.searchParams.set("scope", getScope());
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("redirect_uri", getRedirectUri(request));

  return url.toString();
}

export async function exchangeCodeForTokens(
  request: NextRequest,
  code: string,
): Promise<TokenResponse> {
  const discovery = await discoverOidcConfiguration();
  const clientId = requiredEnv("ROEID_CLIENT_ID");
  const clientSecret = requiredEnv("ROEID_CLIENT_SECRET");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(request),
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
    cache: "no-store",
  });

  const tokens = (await response.json()) as TokenResponse;
  if (!response.ok || tokens.error) {
    throw new Error(tokens.error_description ?? tokens.error ?? "ROeID token exchange failed");
  }

  return tokens;
}

function decodeJwtPayload(token: string): Claims {
  const [, payload] = token.split(".");
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Claims;
  } catch {
    return {};
  }
}

async function fetchUserInfo(accessToken: string): Promise<Claims> {
  const discovery = await discoverOidcConfiguration();
  if (!discovery.userinfo_endpoint) return {};

  const response = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return {};
  return (await response.json()) as Claims;
}

function claimString(claims: Claims, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

export async function buildUserFromTokens(
  tokens: TokenResponse,
  expectedNonce?: string,
): Promise<AuthUser> {
  const idClaims = tokens.id_token ? decodeJwtPayload(tokens.id_token) : {};
  if (
    expectedNonce &&
    typeof idClaims.nonce === "string" &&
    idClaims.nonce !== expectedNonce
  ) {
    throw new Error("ROeID nonce validation failed");
  }

  const userInfo = tokens.access_token ? await fetchUserInfo(tokens.access_token) : {};
  const claims = { ...idClaims, ...userInfo };

  const givenName = claimString(claims, ["given_name", "givenName", "prenume"]);
  const familyName = claimString(claims, ["family_name", "familyName", "nume"]);
  const fullName =
    claimString(claims, ["name", "nume complet", "nume_complet"]) ||
    [givenName, familyName].filter(Boolean).join(" ") ||
    "Utilizator ROeID";

  return {
    sub: claimString(claims, ["sub", "cnp", "email"]) ?? createRandomToken(),
    name: fullName,
    email: claimString(claims, ["email", "preferred_username"]) ?? "",
    cnp: claimString(claims, ["cnp"]),
    provider: "roeid",
  };
}
