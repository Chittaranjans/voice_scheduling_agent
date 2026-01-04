import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CookieConsent } from "@/components/cookie-consent"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "VoiceScheduler - AI Voice Scheduling Agent",
  description: "Schedule meetings naturally with your voice. AI-powered calendar assistant.",
  keywords: ["voice assistant", "scheduling", "AI", "Google Calendar"],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
