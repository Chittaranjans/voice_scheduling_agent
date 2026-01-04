import { NextRequest, NextResponse } from "next/server"
import { createCalendarEvent, parseSchedulingToEvent, updateCalendarEvent } from "@/lib/google-calendar"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated with Google Calendar", needsAuth: true },
        { status: 401 }
      )
    }

    const schedulingInfo = await request.json()

    // Handle event updates
    if (schedulingInfo.editEventId) {
      const updates: any = {}
      
      if (schedulingInfo.title) {
        updates.title = schedulingInfo.title
      }
      
      if (schedulingInfo.date && schedulingInfo.time) {
        const [year, month, day] = schedulingInfo.date.split("-").map(Number)
        const [hours, minutes] = schedulingInfo.time.split(":").map(Number)
        updates.startTime = new Date(year, month - 1, day, hours, minutes)
        updates.endTime = new Date(updates.startTime.getTime() + 60 * 60 * 1000) // 1 hour
      }
      
      if (schedulingInfo.attendeeEmails?.length > 0) {
        updates.attendeeEmails = schedulingInfo.attendeeEmails
      }
      
      const result = await updateCalendarEvent(accessToken, schedulingInfo.editEventId, updates)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          htmlLink: result.htmlLink,
          message: "Event updated successfully!",
        })
      } else {
        return NextResponse.json(
          { error: result.error || "Failed to update event" },
          { status: 500 }
        )
      }
    }

    // Handle new event creation
    if (!schedulingInfo.date || !schedulingInfo.time || !schedulingInfo.title) {
      return NextResponse.json(
        { error: "Missing required scheduling information" },
        { status: 400 }
      )
    }

    // Convert scheduling info to calendar event (includes attendeeEmails)
    const event = parseSchedulingToEvent({
      name: schedulingInfo.name || "User",
      date: schedulingInfo.date,
      time: schedulingInfo.time,
      title: schedulingInfo.title,
      attendeeEmails: schedulingInfo.attendeeEmails || [],
    })

    // Create the calendar event
    const result = await createCalendarEvent(accessToken, event)

    if (result.success) {
      const attendeeMsg = schedulingInfo.attendeeEmails?.length > 0 
        ? ` Invitations sent to ${schedulingInfo.attendeeEmails.length} attendee(s).`
        : ""
      return NextResponse.json({
        success: true,
        eventId: result.eventId,
        htmlLink: result.htmlLink,
        message: `Successfully created "${schedulingInfo.title}" on ${schedulingInfo.date} at ${schedulingInfo.time}.${attendeeMsg}`,
      })
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to create event" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    )
  }
}
