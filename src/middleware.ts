import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { hasSupabasePublicEnv, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env"

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/onboarding",
  "/forgot-password",
  "/auth/callback",
  "/privacy",
  "/terms",
  "/sources",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next({ request })
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session cookies on every navigation (Supabase SSR recommendation).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = publicRoutes.some((route) => pathname === route)

  if (!isPublic && pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
