"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface LiveWaveformProps {
  active?: boolean
  processing?: boolean
  height?: number
  stream?: MediaStream | null
  className?: string
  barWidth?: number
  barGap?: number
  barColor?: string
  sensitivity?: number
  fadeEdges?: boolean
  mode?: "static" | "scrolling"
}

export function LiveWaveform({
  active = false,
  processing = false,
  height = 100,
  stream,
  className,
  barWidth = 4,
  barGap = 3,
  barColor,
  sensitivity = 1.2,
  fadeEdges = true,
  mode = "static",
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>([])
  const targetBarsRef = useRef<number[]>([])
  const historyRef = useRef<number[]>([])
  
  const barRadius = 2

  // Smooth interpolation
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`

    const width = rect.width
    const centerY = height / 2
    const barCount = Math.floor(width / (barWidth + barGap))
    
    // Initialize bars if needed
    if (barsRef.current.length !== barCount) {
      barsRef.current = new Array(barCount).fill(0.05)
      targetBarsRef.current = new Array(barCount).fill(0.05)
    }

    let time = 0

    const draw = () => {
      time += 0.016 // ~60fps
      ctx.clearRect(0, 0, width, height)

      // Smoothly interpolate bars towards targets
      for (let i = 0; i < barCount; i++) {
        const smoothFactor = active ? 0.3 : 0.15
        barsRef.current[i] = lerp(barsRef.current[i], targetBarsRef.current[i], smoothFactor)
      }

      // Update target bars based on state
      if (processing) {
        // Smooth wave animation for processing
        for (let i = 0; i < barCount; i++) {
          const wave1 = Math.sin(time * 2.5 + i * 0.15) * 0.25
          const wave2 = Math.sin(time * 3.5 + i * 0.1) * 0.15
          const wave3 = Math.sin(time * 1.8 + i * 0.2) * 0.1
          targetBarsRef.current[i] = 0.35 + wave1 + wave2 + wave3
        }
      } else if (!active) {
        // Subtle idle animation
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time * 1.2 + i * 0.08) * 0.02
          targetBarsRef.current[i] = 0.05 + wave
        }
      }

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap)
        const normalizedX = i / barCount
        
        // Smooth edge fade using sine
        let edgeFade = 1
        if (fadeEdges) {
          edgeFade = Math.sin(normalizedX * Math.PI)
        }
        const barValue = barsRef.current[i] * edgeFade
        const barHeight = Math.max(barValue * height * 0.85 * sensitivity, 3)

        // Colors based on state or custom color
        let color1: string, color2: string
        
        if (barColor) {
          color1 = barColor
          color2 = barColor.replace(/[\d.]+\)$/, '0.5)')
        } else if (active) {
          // Recording - black/grey to match website UI
          color1 = "rgba(31, 41, 55, 0.95)"
          color2 = "rgba(75, 85, 99, 0.6)"
        } else if (processing) {
          // Processing - black/grey pulse to match website UI
          const pulse = 0.6 + Math.sin(time * 4) * 0.3
          color1 = `rgba(31, 41, 55, ${pulse})`
          color2 = `rgba(75, 85, 99, ${pulse * 0.6})`
        } else {
          // Idle - light gray
          color1 = "rgba(156, 163, 175, 0.3)"
          color2 = "rgba(156, 163, 175, 0.15)"
        }

        // Create vertical gradient
        const gradient = ctx.createLinearGradient(
          x, centerY - barHeight / 2,
          x, centerY + barHeight / 2
        )
        gradient.addColorStop(0, color2)
        gradient.addColorStop(0.5, color1)
        gradient.addColorStop(1, color2)

        // Add glow effect for active states
        if ((active || processing) && barValue > 0.12) {
          ctx.shadowColor = "rgba(31, 41, 55, 0.3)"
          ctx.shadowBlur = 8
        }

        // Draw rounded bar
        ctx.fillStyle = gradient
        ctx.beginPath()
        
        const y = centerY - barHeight / 2
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, barRadius)
        } else {
          ctx.moveTo(x + barRadius, y)
          ctx.lineTo(x + barWidth - barRadius, y)
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + barRadius)
          ctx.lineTo(x + barWidth, y + barHeight - barRadius)
          ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - barRadius, y + barHeight)
          ctx.lineTo(x + barRadius, y + barHeight)
          ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - barRadius)
          ctx.lineTo(x, y + barRadius)
          ctx.quadraticCurveTo(x, y, x + barRadius, y)
        }
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [active, processing, height, barWidth, barGap, barColor, sensitivity, fadeEdges])

  // Audio analysis
  useEffect(() => {
    if (!active || !stream) {
      // Smoothly reset to idle
      const barCount = targetBarsRef.current.length
      for (let i = 0; i < barCount; i++) {
        targetBarsRef.current[i] = 0.05
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      return
    }

    let cancelled = false

    const setupAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.75
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateBars = () => {
          if (cancelled || !analyserRef.current) return

          analyserRef.current.getByteFrequencyData(dataArray)
          
          const barCount = targetBarsRef.current.length
          const dataLength = dataArray.length
          
          if (mode === "static") {
            // Symmetric waveform - mirrored from center
            for (let i = 0; i < barCount; i++) {
              const centerOffset = Math.abs(i - barCount / 2) / (barCount / 2)
              const dataIndex = Math.floor(centerOffset * dataLength * 0.75)
              const value = dataArray[dataIndex] / 255
              
              // Add natural variation
              const boost = 1 + Math.sin(i * 0.3) * 0.2
              targetBarsRef.current[i] = Math.max(0.08, value * boost * sensitivity)
            }
          } else {
            // Scrolling mode - push new values
            const average = dataArray.reduce((sum, val) => sum + val, 0) / dataLength / 255
            historyRef.current.push(average * sensitivity)
            if (historyRef.current.length > barCount) {
              historyRef.current.shift()
            }
            for (let i = 0; i < barCount; i++) {
              targetBarsRef.current[i] = historyRef.current[i] || 0.05
            }
          }

          requestAnimationFrame(updateBars)
        }

        updateBars()
      } catch (error) {
        console.error("Audio setup error:", error)
      }
    }

    setupAudio()

    return () => {
      cancelled = true
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
    }
  }, [active, stream, mode, sensitivity])

  return (
    <div className={cn("w-full", className)}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
