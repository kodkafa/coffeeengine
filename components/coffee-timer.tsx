"use client"

import { Coffee } from "lucide-react"
import { useEffect, useState } from "react"

interface CoffeeTimerProps {
  verifiedAt: Date
  durationMinutes: number
  onExpire: () => void
}

export function CoffeeTimer({ verifiedAt, durationMinutes, onExpire }: CoffeeTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [showTimer, setShowTimer] = useState(false)

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date()
      const expiryTime = new Date(verifiedAt.getTime() + durationMinutes * 60 * 1000)
      const diff = Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000))
      return diff
    }

    // Initial calculation
    const initialRemaining = calculateRemaining()
    setRemainingSeconds(initialRemaining)

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingSeconds(remaining)

      if (remaining === 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [verifiedAt, durationMinutes, onExpire])

  // Calculate progress percentage (0-100)
  const totalSeconds = durationMinutes * 60
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate stroke-dasharray for circular progress
  const circumference = 2 * Math.PI * 40 // radius = 40
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div
      className="absolute top-4 right-4 z-10 cursor-pointer"
      onMouseEnter={() => setShowTimer(true)}
      onMouseLeave={() => setShowTimer(false)}
    >
      <div className="relative w-20 h-20">
        {/* Circular progress background */}
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-1000"
          />
        </svg>

        {/* Coffee icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Coffee className="w-6 h-6 text-primary" />
        </div>

        {/* Timer text - shown on hover or always if less than 1 minute */}
        {(showTimer || remainingSeconds < 60) && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className="bg-background border border-border rounded-md px-2 py-1 shadow-sm">
              <span className="text-xs font-mono font-medium text-foreground">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

