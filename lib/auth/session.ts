import type { SessionOptions } from "iron-session";

export type SessionData = {
  accessToken: string;
  linearUserId: string;
};

const password = process.env.SESSION_PASSWORD;
if (!password || password.length < 32) {
  throw new Error("SESSION_PASSWORD must be at least 32 characters. Set it in .env.local.");
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "better-linear-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};
