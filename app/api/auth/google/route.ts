import { NextResponse } from "next/server"
import { getAuthUrl } from "@/lib/google-calendar"

export async function GET() {
  try {
    // Check if Google credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google Calendar not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
        { status: 500 }
      )
    }

    const authUrl = getAuthUrl()
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Auth URL error:", error)
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    )
  }
}
