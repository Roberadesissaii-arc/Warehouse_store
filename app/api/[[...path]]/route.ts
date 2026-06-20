import type { NextRequest } from "next/server";
import { forwardSetCookies } from "@/lib/proxyCookies";

const BACKEND = process.env.STORE_BACKEND_URL || "http://127.0.0.1:5004";

async function proxy(req: NextRequest, path: string[]) {
  const target = `${BACKEND}/api/${path.join("/")}${req.nextUrl.search}`;
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(target, init);
  const outHeaders = new Headers();
  const contentTypeOut = res.headers.get("content-type");
  if (contentTypeOut) outHeaders.set("content-type", contentTypeOut);

  forwardSetCookies(res, outHeaders);

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
