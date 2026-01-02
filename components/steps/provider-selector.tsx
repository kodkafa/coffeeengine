"use client"

import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import type React from "react"
import * as LucideIcons from "lucide-react"

export interface ProviderOption {
  id: string
  name: string
  url: string
  icon?: string // Icon name from lucide-react
}

interface ProviderSelectorProps {
  providers: ProviderOption[]
  onProviderSelect?: (providerId: string) => void
  className?: string
}

/**
 * Dynamic icon loader for lucide-react icons
 */
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) {
    return <Coffee className="h-4 w-4" />
  }

  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (IconComponent) {
    return <IconComponent className="h-4 w-4" />
  }

  return <Coffee className="h-4 w-4" />
}

export function ProviderSelector({ providers, onProviderSelect, className }: ProviderSelectorProps) {
  const handleClick = (provider: ProviderOption) => async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    // Save provider to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("coffee_engine_provider", provider.id)
    }
    
    // Send provider selection to step engine first
    if (onProviderSelect) {
      await onProviderSelect(provider.id)
    }
    
    // Then open provider URL in new tab after a short delay to ensure message is sent
    setTimeout(() => {
      if (provider.url && provider.url !== "#") {
        window.open(provider.url, "_blank", "noopener,noreferrer")
      }
    }, 100)
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {providers.map((provider) => (
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

