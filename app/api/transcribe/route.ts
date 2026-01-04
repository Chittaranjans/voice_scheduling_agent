import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Using gemini-2.5-flash - confirmed working via test
const MODEL_NAME = "gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    
    // Handle FormData (audio file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const audioFile = formData.get("audio") as File

      if (!audioFile) {
        return NextResponse.json(
          { error: "Audio file is required" },
          { status: 400 }
        )
      }

      // Convert File to ArrayBuffer then to base64
      const arrayBuffer = await audioFile.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString("base64")

      // Determine MIME type
      let mimeType = audioFile.type || "audio/webm"
      if (!mimeType.startsWith("audio/")) {
        mimeType = "audio/webm"
      }

      console.log("Transcribing audio with Gemini:", {
        name: audioFile.name,
        type: mimeType,
        size: audioFile.size,
      })

      // Use Gemini for transcription
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

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

      const transcription = result.response.text().trim()
      console.log("Gemini transcription result:", transcription)

      return NextResponse.json({ text: transcription })
    }
    
    // Handle JSON (text from Web Speech API fallback)
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    console.log("Received transcription from Web Speech API:", text)
    return NextResponse.json({ text: text.trim() })
    
  } catch (error) {
    console.error("Transcription API error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
