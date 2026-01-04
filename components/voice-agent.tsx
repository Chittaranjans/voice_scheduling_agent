"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square, Loader2, Calendar, Check, ExternalLink, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LiveWaveform } from "@/components/ui/live-waveform"
import { TranscriptionDisplay } from "@/components/ui/transcription-display"
import { AudioInputWaveform } from "@/components/ui/audio-input-waveform"
import { cn } from "@/lib/utils"

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionType extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((this: SpeechRecognitionType, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionType, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionType, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognitionType, ev: SpeechRecognitionErrorEvent) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType
    webkitSpeechRecognition: new () => SpeechRecognitionType
  }
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface SchedulingInfo {
  name: string
  date: string
  time: string
  title: string
  attendeeEmails?: string[]
  editEventId?: string
}

interface VoiceAgentProps {
  onAuthChange?: (authenticated: boolean) => void
}

interface UserProfile {
  name: string
  email: string
  picture?: string
}

export function VoiceAgent({ onAuthChange }: VoiceAgentProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [eventCreated, setEventCreated] = useState<{
    success: boolean
    htmlLink?: string
    message?: string
  } | null>(null)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [greetingSpoken, setGreetingSpoken] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const autoListenRef = useRef<(() => void) | null>(null)
  const greetingSpokenRef = useRef(false)

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const englishVoices = voices.filter(v => v.lang.startsWith('en'))
      if (englishVoices.length > 0) {
        setAvailableVoices(englishVoices)
        // Try to find a good default voice
        const googleVoice = englishVoices.findIndex(v => v.name.includes('Google'))
        const femaleVoice = englishVoices.findIndex(v => v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Samantha'))
        setSelectedVoiceIndex(googleVoice >= 0 ? googleVoice : femaleVoice >= 0 ? femaleVoice : 0)
        setVoicesLoaded(true)
      }
    }

    // Load voices immediately if available
    loadVoices()
    
    // Also listen for voiceschanged event
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
    
    // Check URL params for auth result
    const params = new URLSearchParams(window.location.search)
    const authResult = params.get("auth")
    if (authResult === "success") {
      setIsAuthenticated(true)
      // Reset greeting state for new auth session
      setMessages([])
      setGreetingSpoken(false)
      greetingSpokenRef.current = false
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // Store previous auth state to detect logout vs initial load
  const prevAuthRef = useRef<boolean | null>(null)

  // Reset greeting when user explicitly disconnects (not on initial load)
  useEffect(() => {
    if (authChecked) {
      // Only reset if user was previously authenticated and now is not (explicit logout)
      if (prevAuthRef.current === true && !isAuthenticated) {
        setMessages([])
        setGreetingSpoken(false)
        greetingSpokenRef.current = false
        setUserProfile(null)
      }
      prevAuthRef.current = isAuthenticated
    }
  }, [authChecked, isAuthenticated])

  // Auto-scroll within messages container whenever content changes
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 50)
    }
  }, [messages, isRecording, isProcessing, isSpeaking, liveTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status")
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      onAuthChange?.(data.authenticated)
      
      // If authenticated, fetch user profile
      if (data.authenticated) {
        try {
          const profileRes = await fetch("/api/user/profile")
          if (profileRes.ok) {
            const profile = await profileRes.json()
            setUserProfile(profile)
          }
        } catch (e) {
          console.error("Profile fetch failed:", e)
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setAuthChecked(true)
    }
  }

  const handleGoogleAuth = async () => {
    setIsConnecting(true)
    setAuthError(null)
    
    try {
      const response = await fetch("/api/auth/google")
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else if (data.error) {
        setAuthError(data.error)
        setIsConnecting(false)
      }
    } catch (error) {
      setAuthError("Failed to connect. Please try again.")
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/auth/disconnect", { method: "POST" })
      setIsAuthenticated(false)
      setUserProfile(null)
      onAuthChange?.(false)
    } catch (error) {
      console.error("Disconnect error:", error)
    }
  }

  const speak = useCallback((text: string, autoListenAfter: boolean = true) => {
    if (!ttsEnabled || !window.speechSynthesis || !voicesLoaded) {
      // If TTS is disabled but we should auto-listen, start after a short delay
      if (autoListenAfter && autoListenRef.current) {
        setTimeout(() => {
          autoListenRef.current?.()
        }, 500)
      }
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Use the selected voice
    if (availableVoices.length > 0 && availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex]
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      // Auto-start listening after AI finishes speaking
      if (autoListenAfter && autoListenRef.current) {
        setTimeout(() => {
          autoListenRef.current?.()
        }, 300)
      }
    }
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [ttsEnabled, voicesLoaded, availableVoices, selectedVoiceIndex])

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const processUserInput = useCallback(async (userInput: string) => {
    if (!userInput || userInput.trim() === "") {
      speak("I didn't catch that. Could you please try again?")
      return
    }

    setIsProcessing(true)

    try {
      // Add user message
      const userMessage: Message = { role: "user", content: userInput }
      setMessages((prev) => [...prev, userMessage])

      // Process conversation with Gemini
      const conversationResponse = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMessage],
          userInput,
        }),
      })

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json().catch(() => ({}))
        throw new Error(errorData.details || "Failed to process conversation")
      }

      const { response, schedulingInfo } = await conversationResponse.json()

      // Add assistant message
      const assistantMessage: Message = { role: "assistant", content: response }
      setMessages((prev) => [...prev, assistantMessage])

      // Speak the response
      speak(response)

      // If scheduling is confirmed, create calendar event
      if (schedulingInfo?.confirmed) {
        await createCalendarEvent(schedulingInfo)
      }
    } catch (error) {
      console.error("Processing error:", error)
      const errorMsg = error instanceof Error ? error.message : ""
      let errorMessage = "Sorry, I encountered an error. Please try again."
      
      if (errorMsg.includes("rate limit") || errorMsg.includes("quota") || errorMsg.includes("429")) {
        errorMessage = "I'm getting too many requests right now. Please wait a moment and try again."
      }
      
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }])
      speak(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [speak])

  const startRecording = async () => {
    try {
      // Stop any ongoing speech
      stopSpeaking()

      // Check for Web Speech API support
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionAPI) {
        throw new Error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.")
      }

      // Get microphone stream for waveform visualization
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(mediaStream)

      // Initialize speech recognition
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsRecording(true)
        setLiveTranscript("")
      }

      recognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setLiveTranscript(finalTranscript || interimTranscript)

        // If we have a final result, process it
        if (finalTranscript) {
          // Stop the stream
          mediaStream.getTracks().forEach(track => track.stop())
          setStream(null)
          setIsRecording(false)
          processUserInput(finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        // Handle errors silently for no-speech (common when user doesn't speak)
        mediaStream.getTracks().forEach(track => track.stop())
        setStream(null)
        setIsRecording(false)
        
        if (event.error === "no-speech") {
          // Silent handling - just reset, no need to show error
          return
        } else if (event.error === "not-allowed") {
          alert("Microphone access was denied. Please allow microphone access and try again.")
        } else if (event.error === "aborted") {
          // User stopped - no action needed
          return
        }
      }

      recognition.onend = () => {
        // If ended without final result, stop everything
        if (stream) {
          mediaStream.getTracks().forEach(track => track.stop())
          setStream(null)
        }
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()

    } catch (error) {
      console.error("Failed to start recording:", error)
      alert(error instanceof Error ? error.message : "Failed to start recording")
      setIsRecording(false)
      setStream(null)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsRecording(false)
  }

  // Auto-start recording with auto-timeout (closes after 5 seconds of no speech)
  const startRecordingAuto = useCallback(async () => {
    // Don't auto-start if already recording or processing
    if (isRecording || isProcessing || isSpeaking) return
    
    try {
      // Stop any ongoing speech
      stopSpeaking()

      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionAPI) return

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(mediaStream)

      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "en-US"

      // Auto-close timeout after 5 seconds of no speech
      let autoCloseTimeout: NodeJS.Timeout | null = null
      const resetAutoClose = () => {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout)
        autoCloseTimeout = setTimeout(() => {
          recognition.stop()
        }, 5000)
      }

      recognition.onstart = () => {
        setIsRecording(true)
        setLiveTranscript("")
        resetAutoClose()
      }

      recognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setLiveTranscript(finalTranscript || interimTranscript)
        
        // Reset auto-close when user is speaking
        if (interimTranscript) {
          resetAutoClose()
        }

        if (finalTranscript) {
          if (autoCloseTimeout) clearTimeout(autoCloseTimeout)
          mediaStream.getTracks().forEach(track => track.stop())
          setStream(null)
          setIsRecording(false)
          processUserInput(finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout)
        mediaStream.getTracks().forEach(track => track.stop())
        setStream(null)
        setIsRecording(false)
      }

      recognition.onend = () => {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout)
        mediaStream.getTracks().forEach(track => track.stop())
        setStream(null)
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()

    } catch (error) {
      console.error("Auto-recording failed:", error)
      setIsRecording(false)
      setStream(null)
    }
  }, [isRecording, isProcessing, isSpeaking, processUserInput])

  // Keep autoListenRef updated
  useEffect(() => {
    autoListenRef.current = startRecordingAuto
  }, [startRecordingAuto])

  const createCalendarEvent = async (schedulingInfo: SchedulingInfo) => {
    if (!isAuthenticated) {
      const authMessage = "To create the calendar event, please connect your Google Calendar first."
      setMessages((prev) => [...prev, { role: "assistant", content: authMessage }])
      speak(authMessage)
      return
    }

    try {
      const response = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedulingInfo,
          editEventId: schedulingInfo.editEventId,
        }),
      })


      const result = await response.json()

      if (result.success) {
        setEventCreated({
          success: true,
          htmlLink: result.htmlLink,
          message: result.message,
        })
        
        let successMessage: string
        if (schedulingInfo.editEventId) {
          successMessage = "I've updated your calendar event successfully!"
        } else {
          successMessage = `I've created your calendar event: "${schedulingInfo.title}" on ${schedulingInfo.date} at ${schedulingInfo.time}.`
          if (schedulingInfo.attendeeEmails && schedulingInfo.attendeeEmails.length > 0) {
            successMessage += ` Invitations have been sent to ${schedulingInfo.attendeeEmails.length} attendee${schedulingInfo.attendeeEmails.length > 1 ? 's' : ''}.`
          }
          successMessage += " You're all set!"
        }
        setMessages((prev) => [...prev, { role: "assistant", content: successMessage }])
        // No auto-listen after event creation - conversation is complete
        speak(successMessage, false)
      } else if (result.needsAuth) {
        setIsAuthenticated(false)
        const authMessage = "Your Google Calendar session has expired. Please reconnect to create the event."
        setMessages((prev) => [...prev, { role: "assistant", content: authMessage }])
        speak(authMessage, false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Calendar error:", error)
      const errorMessage = "I couldn't create the calendar event. Please try again or connect your Google Calendar."
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }])
      speak(errorMessage)
    }
  }

  // Start with a greeting if no messages - wait for profile to load first
  useEffect(() => {
    // Only set greeting once when auth is checked
    // If authenticated, wait for profile to load before setting greeting
    if (messages.length === 0 && authChecked) {
      // If authenticated but profile not loaded yet, wait
      if (isAuthenticated && !userProfile) {
        return
      }
      
      let greeting: string
      if (userProfile?.name) {
        const firstName = userProfile.name.split(' ')[0]
        greeting = `Hello ${firstName}! I'm your voice scheduling assistant. Click the microphone and tell me what meeting you'd like to schedule.`
      } else {
        greeting = "Hello! I'm your voice scheduling assistant. Click the microphone and tell me your name to get started."
      }
      setMessages([{ role: "assistant", content: greeting }])
    }
  }, [authChecked, userProfile, isAuthenticated, messages.length])

  // Speak greeting only once when voices are loaded (no auto-listen for greeting)
  // Note: Browser requires user interaction before playing audio, so we try to speak
  // but gracefully handle if it's blocked. The greeting will show as text regardless.
  useEffect(() => {
    // Use ref to prevent the re-render from clearing the timer
    if (greetingSpokenRef.current) {
      return
    }
    
    // Wait for all conditions to be ready
    if (!voicesLoaded || messages.length !== 1 || !authChecked) {
      return
    }
    
    const greeting = messages[0]?.content
    if (!greeting || messages[0]?.role !== 'assistant') {
      return
    }
    
    // Check TTS conditions early
    if (!ttsEnabled || !window.speechSynthesis || availableVoices.length === 0) {
      return
    }
    
    // Mark as spoken immediately using ref (no re-render)
    greetingSpokenRef.current = true
    setGreetingSpoken(true)
    
    // Cancel any ongoing speech first to prevent overlap
    window.speechSynthesis.cancel()
    
    // Try to speak - may fail due to browser autoplay policy
    const utterance = new SpeechSynthesisUtterance(greeting)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    if (availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex]
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    // Attempt to speak - will work if user has interacted with page before
    window.speechSynthesis.speak(utterance)
  }, [voicesLoaded, messages, authChecked, ttsEnabled, availableVoices, selectedVoiceIndex])

  return (
    <div className="space-y-5">
      {/* Google Calendar Connection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isAuthenticated && userProfile?.picture ? (
              <img 
                src={userProfile.picture} 
                alt={userProfile.name || "Profile"}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-green-100 shadow-sm"
              />
            ) : (
              <div className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl shadow-sm",
                isAuthenticated 
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white" 
                  : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500"
              )}>
                <Calendar className="h-7 w-7" />
              </div>
            )}
            <div>
              {isAuthenticated && userProfile ? (
                <>
                  <p className="font-semibold text-gray-900">{userProfile.name}</p>
                  <p className="text-sm text-gray-500">{userProfile.email}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900">Google Calendar</p>
                  <p className="text-sm text-gray-500">
                    {isConnecting ? "Connecting..." : "Connect to create events"}
                  </p>
                </>
              )}
              {authError && (
                <p className="text-xs text-red-500 mt-1">{authError}</p>
              )}
            </div>
          </div>
          {!isAuthenticated ? (
            <Button 
              onClick={handleGoogleAuth} 
              className="text-sm h-11 px-5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-sm"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Google
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-semibold border border-green-100">
                <Check className="h-3.5 w-3.5" />
                Connected
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs text-gray-500 hover:text-red-600 h-7 px-2"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Interface */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">Voice Assistant</span>
              <p className="text-xs text-gray-500">Speak naturally to schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Voice Selection */}
            {availableVoices.length > 1 && (
              <select
                value={selectedVoiceIndex}
                onChange={(e) => {
                  const newIndex = Number(e.target.value)
                  setSelectedVoiceIndex(newIndex)
                  // Preview the new voice with the greeting
                  if (ttsEnabled && window.speechSynthesis && availableVoices[newIndex]) {
                    window.speechSynthesis.cancel()
                    const utterance = new SpeechSynthesisUtterance("Hello! I'm your voice scheduling assistant. Click the microphone and tell me your name to get started.")
                    utterance.voice = availableVoices[newIndex]
                    utterance.rate = 1.0
                    utterance.pitch = 1.0
                    utterance.onstart = () => setIsSpeaking(true)
                    utterance.onend = () => setIsSpeaking(false)
                    utterance.onerror = () => setIsSpeaking(false)
                    window.speechSynthesis.speak(utterance)
                  }
                }}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 max-w-[160px] cursor-pointer"
                title="Select voice"
              >
                {availableVoices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name.replace('Microsoft ', '').replace('Google ', '').replace(' - English (United States)', '').replace(' - English (United Kingdom)', '')}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={cn(
                "h-8 w-8 rounded-lg transition-colors",
                ttsEnabled ? "text-violet-600 hover:bg-violet-50" : "text-gray-400 hover:bg-gray-100"
              )}
              title={ttsEnabled ? "Mute" : "Unmute"}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="p-5">
          {/* Messages */}
          <div ref={messagesContainerRef} className="space-y-3 min-h-[450px] max-h-[650px] overflow-y-auto scroll-smooth pr-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {/* Waveform - inside messages area */}
            {(isRecording || isProcessing) && (
              <div className="py-6">
                <AudioInputWaveform
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  stream={stream}
                  height={80}
                />
                
                {isRecording && liveTranscript && (
                  <TranscriptionDisplay
                    text={liveTranscript}
                    isRecording={isRecording}
                    className="mt-2"
                  />
                )}
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl text-violet-600 text-xs font-medium border border-violet-100">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                  Speaking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mic Button - Compact */}
          <div className="flex flex-col items-center justify-center gap-2 py-4 border-t border-gray-100">
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 w-14 h-14 -m-1 rounded-full bg-red-100 animate-ping" />
              )}
              <Button
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={cn(
                  "h-12 w-12 rounded-full transition-all relative",
                  isRecording 
                    ? "bg-white border-2 border-red-500 text-red-500 hover:bg-red-50" 
                    : isProcessing 
                      ? "bg-white border-2 border-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-white border-2 border-gray-800 text-gray-800 hover:bg-gray-50"
                )}
              >
                {isRecording ? (
                  <Square className="h-5 w-5 fill-current" />
                ) : isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Tap to speak"}
            </p>
          </div>

          {/* Success Message */}
          {eventCreated?.success && (
            <div className="p-5 mx-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800">Event Created Successfully!</p>
                  <p className="text-sm text-green-700 mt-1">Your meeting has been added to Google Calendar</p>
                  {eventCreated.htmlLink && (
                    <a
                      href={eventCreated.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-white rounded-lg text-sm text-green-700 hover:text-green-800 font-medium shadow-sm border border-green-200 hover:border-green-300 transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      View in Calendar
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
