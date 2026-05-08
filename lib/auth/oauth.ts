import { z } from "zod";

export const LINEAR_AUTH_URL = "https://linear.app/oauth/authorize";
export const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";

export type AuthUrlInput = { clientId: string; redirectUri: string; state: string };

export function buildLinearAuthUrl({ clientId, redirectUri, state }: AuthUrlInput): string {
  const u = new URL(LINEAR_AUTH_URL);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "read");
  u.searchParams.set("state", state);
  return u.toString();
}

export function validateOAuthState(
  cookieState: string | null | undefined,
  queryState: string | null | undefined,
): boolean {
  if (!cookieState || !queryState) return false;
  return cookieState === queryState;
}

const TokenResponse = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number().int().nonnegative(),
  scope: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponse>;

export async function exchangeCodeForToken(args: {
  code: string; clientId: string; clientSecret: string; redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(LINEAR_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error(`Linear token exchange failed: ${res.status}`);
  return TokenResponse.parse(await res.json());
}
