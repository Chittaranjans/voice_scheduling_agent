"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, ExternalLink, RefreshCw, User, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  htmlLink?: string
}

interface UserProfile {
  name: string
  email: string
  picture?: string
}

interface CalendarSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function CalendarSidebar({ isOpen, onToggle }: CalendarSidebarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch profile
      const profileRes = await fetch("/api/user/profile")
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData)
      }

      // Fetch events
      const eventsRes = await fetch("/api/calendar/events")
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }
    } catch (err) {
      setError("Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.start).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {} as Record<string, CalendarEvent[]>)

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 p-2.5 rounded-l-xl shadow-lg transition-all hover:bg-gray-50",
          isOpen ? "right-80" : "right-0"
        )}
      >
        {isOpen ? <ChevronRight className="h-4 w-4 text-gray-600" /> : <ChevronLeft className="h-4 w-4 text-gray-600" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-2xl z-30 transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Calendar className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Your Calendar</h2>
                  <p className="text-xs text-gray-500">Upcoming events</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchData}
                disabled={loading}
                className="h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className={cn("h-4 w-4 text-gray-500", loading && "animate-spin")} />
              </Button>
            </div>

            {/* User Profile */}
            {profile && (
              <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-11 h-11 rounded-full ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{profile.name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
              </div>
            )}
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm text-red-600 font-medium">Failed to load</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-700 mb-1">No upcoming events</p>
                <p className="text-sm text-gray-500">Your schedule is clear!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedEvents).map(([dateStr, dateEvents]) => (
                  <div key={dateStr}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        {formatEventDate(dateEvents[0].start)}
                      </h3>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      {dateEvents.map((event) => (
                        <div
                          key={event.id}
                          className="group p-3.5 bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate group-hover:text-violet-700 transition-colors">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {formatEventTime(event.start)} - {formatEventTime(event.end)}
                                </span>
                              </div>
                            </div>
                            {event.htmlLink && (
                              <a
                                href={event.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-600 transition-all p-1.5 hover:bg-violet-50 rounded-lg"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open Google Calendar
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
