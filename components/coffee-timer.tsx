"use client"

import { ProviderSelector, type ProviderOption } from "@/components/steps/provider-selector"
import { useChatContext } from "@/contexts/chat-context"
import { Coffee } from "lucide-react"
import { useEffect, useState } from "react"

interface CoffeeTimerProps {
  verifiedAt: Date | null
  durationMinutes: number
  onExpire?: () => void
  providers?: ProviderOption[]
  onSendMessage?: (message: string) => Promise<void>
}

export function CoffeeTimer({ verifiedAt, durationMinutes, onExpire, providers, onSendMessage }: CoffeeTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [showTimer, setShowTimer] = useState(false)
  const [showProviders, setShowProviders] = useState(false)
  const isVerified = verifiedAt !== null
  const { onTimerExpire } = useChatContext()

  useEffect(() => {
    if (!verifiedAt) {
      setRemainingSeconds(0)
      return
    }

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
        // Call context callback first (transitions to coffee_break step)
        if (onTimerExpire) {
          onTimerExpire()
        }
        // Then call prop callback if provided
        if (onExpire) {
          onExpire()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [verifiedAt, durationMinutes, onExpire])

  // Calculate progress percentage (0-100)
  const totalSeconds = durationMinutes * 60
  const progress = isVerified && totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0

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
    <div className="absolute top-4 right-6 z-50">
      <div
        className={`relative cursor-pointer transition-opacity duration-300 ${
          showTimer || showProviders ? "opacity-100" : "opacity-50"
        }`}
        onMouseEnter={() => setShowTimer(true)}
        onMouseLeave={() => !showProviders && setShowTimer(false)}
        onClick={() => setShowProviders(!showProviders)}
      >
        <div className="relative w-20 h-20">
          {/* White background circle with shadow */}
          <div className="absolute inset-0 rounded-full bg-white shadow-lg" />
          
          {/* Circular progress background */}
          <svg className="w-20 h-20 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={isVerified ? "text-black" : "text-muted"}
            />
            {/* Progress circle - only show if verified */}
            {isVerified && (
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
            )}
          </svg>

          {/* Coffee icon in center */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Coffee className={`w-6 h-6 ${isVerified ? "text-primary" : "text-black/50"}`} />
          </div>

          {/* Timer text - shown on hover or always if less than 1 minute */}
          {(showTimer) && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-30">
              <div className="bg-background border border-border rounded-md px-2 py-1 shadow-sm">


                {isVerified ? (
                  <span className="text-xs font-mono font-medium text-foreground">{formatTime(remainingSeconds)}</span>
                ) : (
                  <span className="text-xs font-mono font-medium text-foreground">fill me up!</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider buttons - shown below timer when clicked */}
      {showProviders && providers && providers.length > 0 && onSendMessage && (
        <div className="absolute top-28 -right-5 z-50">
          <ProviderSelector
            providers={providers}
            onSendMessage={onSendMessage}
            onProviderSelect={async () => {}}
            onVerified={() => {}}
          />
        </div>
      )}
    </div>
  )
}

