import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("google_access_token")?.value

    const response = NextResponse.json({
      authenticated: !!accessToken,
    })
    
    // Prevent caching of auth status
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    
    return response
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
    })
  }
}
