import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export function proxy(request) {
  const nonce = randomBytes(18).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const scriptSources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "https://unpkg.com"];
  const connectSources = ["'self'"];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws:");
  }

  const policy = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: blob: https://upload.wikimedia.org https://commons.wikimedia.org https://api.qrserver.com https://tile.openstreetmap.org https://unpkg.com",
    "font-src 'self' data: https://unpkg.com",
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'self' blob:",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/", "/privacidad"],
};
