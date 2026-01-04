"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TranscriptionDisplayProps {
  text: string
  isRecording?: boolean
  className?: string
}

export function TranscriptionDisplay({
  text,
  isRecording = false,
  className,
}: TranscriptionDisplayProps) {
  const textContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight
    }
  }, [text])

  return (
    <div ref={textContainerRef} className={cn("text-center", className)}>
      {text.trim() ? (
        <p className="text-sm text-gray-600 italic">
          "{text}"
          {isRecording && (
            <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-gray-400 animate-pulse align-text-bottom" />
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-400">
          {isRecording ? "Listening..." : ""}
        </p>
      )}
    </div>
  )
}
