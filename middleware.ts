import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth";

// Toutes les pages demandent le code d'accès, sauf /login.
export async function middleware(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (code && cookie === (await tokenFor(code))) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
