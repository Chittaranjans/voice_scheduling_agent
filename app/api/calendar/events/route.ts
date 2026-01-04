import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCalendarEvents } from "@/lib/google-calendar"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const events = await getCalendarEvents(accessToken)

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Calendar events fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}
