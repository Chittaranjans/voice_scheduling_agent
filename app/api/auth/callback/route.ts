import { NextRequest, NextResponse } from "next/server"
import { getTokensFromCode } from "@/lib/google-calendar"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(new URL("/?auth=error", request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/?auth=missing_code", request.url))
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    // Store tokens in cookies (HttpOnly for security)
    const cookieStore = await cookies()
    
    if (tokens.access_token) {
      cookieStore.set("google_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expiry_date 
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000) 
          : 3600, // 1 hour default
        path: "/",
      })
    }

    if (tokens.refresh_token) {
      cookieStore.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    // Redirect back to the app with success
    return NextResponse.redirect(new URL("/?auth=success", request.url))
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL("/?auth=error", request.url))
  }
}
