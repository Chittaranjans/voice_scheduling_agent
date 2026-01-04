import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear the auth cookies
    cookieStore.delete("google_access_token")
    cookieStore.delete("google_refresh_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    )
  }
}
