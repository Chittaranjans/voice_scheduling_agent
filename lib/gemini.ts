import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Primary and fallback models
const PRIMARY_MODEL = "gemini-2.5-flash"
const FALLBACK_MODEL = "gemini-2.0-flash"

export interface SchedulingInfo {
  name?: string
  date?: string
  time?: string
  title?: string
  attendeeEmails?: string[]
  confirmed?: boolean
  needsInfo?: string[]
  editEventId?: string
  editAction?: "update_time" | "update_title" | "add_attendees"
}

export interface ConversationMessage {
  role: "user" | "assistant"
  content: string
}

export interface ExistingEvent {
  id: string
  title: string
  date: string
  time: string
  attendees: string[]
}

const SYSTEM_PROMPT = `You are a friendly and professional voice scheduling assistant. Your job is to help users schedule meetings on their calendar and manage existing events.

Your personality:
- Warm, helpful, and conversational
- Keep responses concise (1-2 sentences typically)
- Natural and human-like

EXISTING EVENTS CONTEXT:
You have access to the user's upcoming calendar events. When the user refers to "the same person from another meeting" or "the attendee from my other event", you should look up the attendee email from their existing events and use it.

Your goal is to collect the following information for NEW meetings:
1. Preferred date for the meeting
2. Preferred time for the meeting
3. Meeting title (optional - if not provided, suggest a default title)
4. Attendee email addresses (ask who they want to invite to the meeting)

You can also EDIT existing events when the user asks to:
- Change the time of an existing event
- Update the title of an existing event
- Add more attendees to an existing event

For EDITING an existing event, use this format:
[EDIT_EVENT]
EventId: <id of the event to edit>
Action: <update_time|update_title|add_attendees>
NewDate: <new date in YYYY-MM-DD format, if changing time>
NewTime: <new time in HH:MM format, if changing time>
NewTitle: <new title, if changing title>
NewAttendees: <comma-separated emails to add, if adding attendees>
[/EDIT_EVENT]

For CREATING a new event, when confirmed, respond with EXACTLY this format:
[SCHEDULE_CONFIRMED]
Name: <user's name if provided, otherwise "User">
Date: <date in YYYY-MM-DD format>
Time: <time in HH:MM format, 24-hour>
Title: <title>
Attendees: <comma-separated email addresses, or "none" if no attendees>
[/SCHEDULE_CONFIRMED]

Important guidelines:
- When user says "same person" or "same attendee" from another event, look up the email from existing events
- Parse natural language dates like "tomorrow", "next Monday", "January 15th" etc.
- Parse natural language times like "3pm", "15:00", "afternoon", "morning" etc.
- For vague times, suggest specific times (e.g., "morning" -> "How about 10:00 AM?")
- If the date reference is unclear, ask for clarification
- Email addresses must be valid format (e.g., example@gmail.com)
- Multiple attendees should be comma-separated in the output
- Always confirm all details including attendees before creating the event
- Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

export async function processConversation(
  messages: ConversationMessage[],
  userInput: string,
  existingEvents?: ExistingEvent[]
): Promise<{ response: string; schedulingInfo?: SchedulingInfo }> {
  // Try primary model first, then fallback
  const models = [PRIMARY_MODEL, FALLBACK_MODEL]
  let lastError: Error | null = null

  // Build conversation history
  const conversationHistory = messages
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n")

  // Build existing events context
  let eventsContext = ""
  if (existingEvents && existingEvents.length > 0) {
    eventsContext = `\n\nUser's upcoming calendar events:\n${existingEvents.map(e => 
      `- Event ID: ${e.id}, Title: "${e.title}", Date: ${e.date}, Time: ${e.time}, Attendees: ${e.attendees.length > 0 ? e.attendees.join(", ") : "none"}`
    ).join("\n")}`
  }

  const prompt = `${SYSTEM_PROMPT}
${eventsContext}

Previous conversation:
${conversationHistory || "(No previous messages)"}

User: ${userInput}

Respond naturally as the scheduling assistant. Remember to use [SCHEDULE_CONFIRMED]...[/SCHEDULE_CONFIRMED] format only when the user confirms all details for a new event, or [EDIT_EVENT]...[/EDIT_EVENT] when editing an existing event.`

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = result.response.text()

      // Check if editing an existing event
      const editMatch = response.match(
        /\[EDIT_EVENT\]\s*EventId:\s*(.+?)\s*Action:\s*(.+?)\s*(?:NewDate:\s*(.+?)\s*)?(?:NewTime:\s*(.+?)\s*)?(?:NewTitle:\s*(.+?)\s*)?(?:NewAttendees:\s*(.+?)\s*)?\[\/EDIT_EVENT\]/s
      )

      if (editMatch) {
        const schedulingInfo: SchedulingInfo = {
          editEventId: editMatch[1].trim(),
          editAction: editMatch[2].trim() as "update_time" | "update_title" | "add_attendees",
          date: editMatch[3]?.trim(),
          time: editMatch[4]?.trim(),
          title: editMatch[5]?.trim(),
          attendeeEmails: editMatch[6]?.trim()?.split(",").map(e => e.trim()).filter(e => e.includes("@")),
          confirmed: true,
        }

        const cleanResponse = response
          .replace(/\[EDIT_EVENT\][\s\S]*\[\/EDIT_EVENT\]/g, "")
          .trim()

        return {
          response: cleanResponse || "I'm updating your calendar event now...",
          schedulingInfo,
        }
      }

      // Check if scheduling is confirmed
      const scheduleMatch = response.match(
        /\[SCHEDULE_CONFIRMED\]\s*Name:\s*(.+?)\s*Date:\s*(.+?)\s*Time:\s*(.+?)\s*Title:\s*(.+?)\s*Attendees:\s*(.+?)\s*\[\/SCHEDULE_CONFIRMED\]/s
      )

    if (scheduleMatch) {
      // Parse attendees
      const attendeesStr = scheduleMatch[5].trim()
      const attendeeEmails = attendeesStr.toLowerCase() === "none" 
        ? [] 
        : attendeesStr.split(",").map(e => e.trim()).filter(e => e.includes("@"))

      const schedulingInfo: SchedulingInfo = {
        name: scheduleMatch[1].trim(),
        date: scheduleMatch[2].trim(),
        time: scheduleMatch[3].trim(),
        title: scheduleMatch[4].trim(),
        attendeeEmails,
        confirmed: true,
      }

      // Clean response by removing the schedule block
      const cleanResponse = response
        .replace(/\[SCHEDULE_CONFIRMED\][\s\S]*\[\/SCHEDULE_CONFIRMED\]/g, "")
        .trim()

      return {
        response: cleanResponse || "Perfect! I'm creating your calendar event now...",
        schedulingInfo,
      }
    }

    return { response }
    } catch (error) {
      console.error(`Gemini API error with ${modelName}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if it's a rate limit error - try next model
      if (lastError.message.includes("429") || lastError.message.includes("quota")) {
        console.log(`Rate limited on ${modelName}, trying fallback...`)
        continue
      }
      
      // For other errors, throw immediately
      throw new Error(`Failed to process conversation: ${lastError.message}`)
    }
  }

  // All models failed (likely all rate limited)
  throw new Error(
    "AI service is temporarily unavailable due to rate limiting. Please wait a moment and try again."
  )
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string = "audio/webm"): Promise<string> {
  // Use Gemini's multimodal capabilities to transcribe audio
  const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL })

  try {
    // Convert buffer to base64
    const base64Audio = audioBuffer.toString("base64")

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      {
        text: "Transcribe this audio recording exactly as spoken. Output only the transcribed text with no additional commentary, labels, timestamps, or formatting. If the audio is unclear or silent, respond with an empty string.",
      },
    ])

    return result.response.text().trim()
  } catch (error) {
    console.error("Transcription error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Failed to transcribe audio: ${errorMessage}`)
  }
}

export async function generateSpeech(text: string): Promise<ArrayBuffer | null> {
  // Using browser's Web Speech API for TTS (handled client-side)
  // This is a placeholder - the actual TTS will be done on the client
  return null
}
