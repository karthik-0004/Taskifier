import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.endsWith(".map") || pathname.startsWith("/.well-known/")) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/image|favicon.ico).*)"],
}
