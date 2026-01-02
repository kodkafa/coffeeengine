"use client"

import { Button } from "@/components/ui/button"
import { StepComponentProps } from "@/types/chat-ui"
import * as LucideIcons from "lucide-react"
import { Coffee } from "lucide-react"
import type React from "react"

export interface ProviderOption {
  id: string
  name: string
  url: string
  icon?: string // Icon name from lucide-react
}

interface ProviderSelectorProps extends StepComponentProps {
  providers?: ProviderOption[] // Made optional to fit registry strictness, but logic handles it
  className?: string
}

/**
 * Dynamic icon loader for lucide-react icons
 */
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) {
    return <Coffee className="h-4 w-4" />
  }

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (IconComponent) {
    return <IconComponent className="h-4 w-4" />
  }

  return <Coffee className="h-4 w-4" />
}

export function ProviderSelector({ providers, onSendMessage, className }: ProviderSelectorProps) {
  const handleClick = (provider: ProviderOption) => async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    // Save provider to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("coffee_engine_provider", provider.id)
    }

    if (onSendMessage) {
      await onSendMessage(`provider:${provider.id}`)
    }
  }

  // Handle case where providers might be undefined/null if not passed correctly
  const list = providers || []

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {list.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleClick(provider)}
        >
          {getIcon(provider.icon)}
          {provider.name}
        </Button>
      ))}
    </div>
  )
}
