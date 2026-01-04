import { NextRequest, NextResponse } from "next/server"
import { processConversation, type ConversationMessage, type ExistingEvent } from "@/lib/gemini"
import { cookies } from "next/headers"
import { getCalendarEvents } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { messages, userInput } = await request.json()

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: "User input is required" },
        { status: 400 }
      )
    }

    console.log("Processing conversation with Gemini:", { userInput, messageCount: messages?.length || 0 })

    // Get existing calendar events to provide context
    let existingEvents: ExistingEvent[] = []
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("google_access_token")?.value
    
    if (accessToken) {
      try {
        const events = await getCalendarEvents(accessToken, 30)
        existingEvents = events.map(e => ({
          id: e.id,
          title: e.title,
          date: e.start.split("T")[0],
          time: e.start.includes("T") ? e.start.split("T")[1].substring(0, 5) : "00:00",
          attendees: e.attendees || [],
        }))
      } catch (err) {
        console.error("Failed to fetch calendar events for context:", err)
      }
    }

    const validatedMessages: ConversationMessage[] = (messages || []).map(
      (msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: String(msg.content || ""),
      })
    )

    const result = await processConversation(validatedMessages, userInput, existingEvents)
    
    console.log("Gemini response received:", { responseLength: result.response?.length })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Conversation API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to process conversation", details: errorMessage },
      { status: 500 }
    )
  }
}
