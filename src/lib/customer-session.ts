import { createHmac, timingSafeEqual } from "crypto";

export const CUSTOMER_SESSION_COOKIE = "pakeeza_customer_session";

export type CustomerSession = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  iat: number;
  exp: number;
};

function getSessionSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "pakeeza-customer-session-secret";
}

export function signCustomerSession(session: Omit<CustomerSession, "iat" | "exp">) {
  const now = Date.now();
  const payload: CustomerSession = {
    ...session,
    iat: now,
    exp: now + 1000 * 60 * 60 * 24 * 30,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyCustomerSession(value: string | null | undefined) {
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CustomerSession;
    if (!parsed.id || !parsed.email || !parsed.mobile || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getCustomerSessionFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CUSTOMER_SESSION_COOKIE) {
      return verifyCustomerSession(rest.join("="));
    }
  }
  return null;
}