"use client"

import { cn } from "@/lib/utils"
import { LiveWaveform } from "./live-waveform"

interface AudioInputWaveformProps {
  isRecording: boolean
  isProcessing?: boolean
  stream?: MediaStream | null
  className?: string
  height?: number
}

export function AudioInputWaveform({
  isRecording,
  isProcessing = false,
  stream,
  className,
  height = 60,
}: AudioInputWaveformProps) {
  return (
    <div className={cn("w-full", className)}>
      <LiveWaveform
        active={isRecording}
        processing={isProcessing}
        stream={stream}
        height={height}
        barWidth={3}
        barGap={2}
        sensitivity={1.2}
        fadeEdges={true}
        mode="static"
      />
    </div>
  )
}
