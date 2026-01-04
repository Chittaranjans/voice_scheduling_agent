"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie, X } from "lucide-react"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent")
    if (!consent) {
      // Small delay for better UX
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted")
    localStorage.setItem("cookie_consent_date", new Date().toISOString())
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "declined")
    localStorage.setItem("cookie_consent_date", new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-4">
        <button
          onClick={declineCookies}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Cookie className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Cookie Notice</h3>
        </div>
        
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          We use cookies to keep you signed in to Google Calendar.{" "}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={declineCookies}
            className="flex-1 h-8 text-xs"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={acceptCookies}
            className="flex-1 h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
