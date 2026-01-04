"use client"

import { useState, useEffect } from "react"
import { VoiceAgent } from "@/components/voice-agent"
import { CalendarSidebar } from "@/components/calendar-sidebar"
import { Mic, Sparkles, Github, Mail } from "lucide-react"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check auth status to show/hide sidebar toggle
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status")
        const data = await res.json()
        setIsAuthenticated(data.authenticated)
        if (data.authenticated) {
          setSidebarOpen(true) // Auto-open sidebar when authenticated
        }
      } catch (e) {
        console.error("Auth check failed:", e)
      }
    }
    checkAuth()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            AI Voice Scheduling Agent
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
            Voice Scheduler
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto text-lg">
            Schedule meetings naturally with your voice. Just speak, and let AI handle the rest.
          </p>
        </div>

        {/* Voice Agent Component */}
        <VoiceAgent onAuthChange={setIsAuthenticated} />

        {/* How it works - Simple flow */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Schedule meetings in seconds using just your voice</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">1</div>
              <span className="text-gray-700 font-medium">Speak</span>
            </div>
            <div className="hidden sm:block text-gray-300">→</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">2</div>
              <span className="text-gray-700 font-medium">Agent Call</span>
            </div>
            <div className="hidden sm:block text-gray-300">→</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">3</div>
              <span className="text-gray-700 font-medium">Confirm</span>
            </div>
            <div className="hidden sm:block text-gray-300">→</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">4</div>
              <span className="text-gray-700 font-medium">Event Created</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Features</h2>
            <p className="text-gray-500">Everything you need to schedule smarter</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Natural Language",
                desc: "Say 'tomorrow at 3pm' or 'next Monday morning' — the AI understands context and relative dates."
              },
              {
                title: "Auto Attendee Invites",
                desc: "Just mention email addresses and invitations are sent automatically to all participants."
              },
              {
                title: "Google Calendar Sync",
                desc: "Events are created directly in your Google Calendar with one-click access."
              },
              {
                title: "Voice Responses",
                desc: "The assistant speaks back to you, enabling hands-free scheduling."
              },
              {
                title: "Edit Existing Events",
                desc: "Change meeting times, update titles, or add attendees to events already on your calendar."
              },
              {
                title: "Smart Context",
                desc: "Reference past meetings — 'invite the same person from my last interview' just works."
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Voice Scheduler</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://github.com/chittaranjans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:chittaedu18@gmail.com" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Voice Scheduler. By Chittaranjan.
            </p>
          </div>
        </footer>
      </div>

      {/* Calendar Sidebar - only show when authenticated */}
      {isAuthenticated && (
        <CalendarSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      )}
    </main>
  )
}
