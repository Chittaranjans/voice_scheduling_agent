import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserProfile } from "@/lib/google-calendar"

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

    const profile = await getUserProfile(accessToken)

    if (!profile) {
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
