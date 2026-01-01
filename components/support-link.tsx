"use client"

import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import type React from "react"

export interface ProviderLink {
  id: string
  name: string
  url: string
  icon?: React.ReactNode
}

interface SupportLinkProps {
  providers?: ProviderLink[]
  className?: string
  onSupportClick?: () => void
}

const defaultProviders: ProviderLink[] = [
  {
    id: "bmc",
    name: "Buy Me a Coffee",
    url: process.env.NEXT_PUBLIC_BMC_URL || "https://buymeacoffee.com",
    icon: <Coffee className="h-4 w-4" />,
  },
]

export function SupportLink({ providers = defaultProviders, className, onSupportClick }: SupportLinkProps) {
  const handleClick = (provider: ProviderLink) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Save provider to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("coffee_engine_provider", provider.id)
    }
    onSupportClick?.()
    // Still allow the link to work normally
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          asChild
          className="flex items-center gap-2"
        >
          <a href={provider.url} target="_blank" rel="noopener noreferrer" onClick={handleClick(provider)}>
            {provider.icon}
            {provider.name}
          </a>
        </Button>
      ))}
    </div>
  )
}

