/** Forward Set-Cookie from the store API through the Next.js proxy. */
export function forwardSetCookies(res: Response, outHeaders: Headers) {
  const fromGetSetCookie =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];

  const cookies = fromGetSetCookie.length > 0 ? fromGetSetCookie : splitSetCookieHeader(res.headers.get("set-cookie"));

  for (const raw of cookies) {
    if (raw) outHeaders.append("set-cookie", normalizeSetCookie(raw));
  }
}

function splitSetCookieHeader(header: string | null): string[] {
  if (!header) return [];
  // Split combined Set-Cookie headers without breaking Expires=... commas.
  return header.split(/,(?=\s*[^;,]+=)/);
}

function normalizeSetCookie(cookie: string): string {
  let next = cookie.replace(/;\s*Domain=[^;]*/gi, "");
  if (/;\s*Path=/i.test(next)) {
    next = next.replace(/;\s*Path=[^;]*/gi, "; Path=/");
  } else {
    next += "; Path=/";
  }
  return next;
}
