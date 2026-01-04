import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export interface CalendarEvent {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  attendeeName?: string
  attendeeEmails?: string[]
}

export interface CalendarEventItem {
  id: string
  title: string
  start: string
  end: string
  description?: string
  htmlLink?: string
  attendees?: string[]
}

export interface UserProfile {
  name: string
  email: string
  picture?: string
}

export function getAuthUrl(): string {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ]

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  })
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Get user's calendar timezone
    const calendarSettings = await calendar.calendars.get({ calendarId: "primary" })
    const userTimeZone = calendarSettings.data.timeZone || "UTC"

    // Build attendees list
    const attendees = event.attendeeEmails?.map(email => ({ email })) || []

    // Format datetime in the user's timezone (without converting to ISO/UTC)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }

    const calendarEvent = {
      summary: event.title,
      description: event.description || `Meeting scheduled with ${event.attendeeName || "Voice Assistant"}`,
      start: {
        dateTime: formatDateTime(event.startTime),
        timeZone: userTimeZone,
      },
      end: {
        dateTime: formatDateTime(event.endTime),
        timeZone: userTimeZone,
      },
      attendees: attendees.length > 0 ? attendees : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: calendarEvent,
      sendUpdates: attendees.length > 0 ? "all" : "none", // Send invitations to attendees
    })

    return {
      success: true,
      eventId: response.data.id || undefined,
      htmlLink: response.data.htmlLink || undefined,
    }
  } catch (error) {
    console.error("Google Calendar error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create calendar event",
    }
  }
}

export function parseSchedulingToEvent(
  schedulingInfo: { name: string; date: string; time: string; title: string; attendeeEmails?: string[] },
  durationMinutes: number = 60
): CalendarEvent {
  // Parse date (expected format: YYYY-MM-DD)
  const [year, month, day] = schedulingInfo.date.split("-").map(Number)
  
  // Parse time (expected format: HH:MM)
  const [hours, minutes] = schedulingInfo.time.split(":").map(Number)

  const startTime = new Date(year, month - 1, day, hours, minutes)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

  return {
    title: schedulingInfo.title,
    startTime,
    endTime,
    attendeeName: schedulingInfo.name,
    attendeeEmails: schedulingInfo.attendeeEmails,
  }
}

// Get user profile from Google
export async function getUserProfile(accessToken: string): Promise<UserProfile | null> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()
    
    return {
      name: data.name || "User",
      email: data.email || "",
      picture: data.picture || undefined,
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Get upcoming calendar events
export async function getCalendarEvents(
  accessToken: string,
  maxResults: number = 20
): Promise<CalendarEventItem[]> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })
    
    const events = response.data.items || []
    
    return events.map(event => ({
      id: event.id || "",
      title: event.summary || "No Title",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      description: event.description ?? undefined,
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map(a => a.email).filter((e): e is string => !!e) || [],
    }))
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return []
  }
}

// Update an existing calendar event
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: {
    title?: string
    startTime?: Date
    endTime?: Date
    attendeeEmails?: string[]
  }
): Promise<{ success: boolean; htmlLink?: string; error?: string }> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    
    // Get user's calendar timezone
    const calendarSettings = await calendar.calendars.get({ calendarId: "primary" })
    const userTimeZone = calendarSettings.data.timeZone || "UTC"
    
    // Format datetime in the user's timezone (without converting to ISO/UTC)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }
    
    // Get existing event first
    const existing = await calendar.events.get({
      calendarId: "primary",
      eventId,
    })
    
    const updateData: any = {}
    
    if (updates.title) {
      updateData.summary = updates.title
    }
    
    if (updates.startTime) {
      updateData.start = {
        dateTime: formatDateTime(updates.startTime),
        timeZone: userTimeZone,
      }
    }
    
    if (updates.endTime) {
      updateData.end = {
        dateTime: formatDateTime(updates.endTime),
        timeZone: userTimeZone,
      }
    }
    
    if (updates.attendeeEmails) {
      const existingAttendees = existing.data.attendees || []
      const newEmails = updates.attendeeEmails.filter(
        email => !existingAttendees.some(a => a.email === email)
      )
      updateData.attendees = [
        ...existingAttendees,
        ...newEmails.map(email => ({ email }))
      ]
    }
    
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: updateData,
      sendUpdates: updates.attendeeEmails ? "all" : "none",
    })
    
    return {
      success: true,
      htmlLink: response.data.htmlLink || undefined,
    }
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    }
  }
}

// Get a specific event by ID
export async function getCalendarEventById(
  accessToken: string,
  eventId: string
): Promise<CalendarEventItem | null> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    })
    
    const event = response.data
    
    return {
      id: event.id || "",
      title: event.summary || "No Title",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      description: event.description ?? undefined,
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map(a => a.email).filter((e): e is string => !!e) || [],
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}
