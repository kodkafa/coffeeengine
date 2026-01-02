"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StepComponentProps } from "@/types/chat-ui"
import { AlertTriangle, HelpCircle } from "lucide-react"

interface SupportCardProps extends StepComponentProps {
  title?: string
  description?: string
  errorContext?: {
    message?: string
    step?: string
    details?: string
  }
  className?: string
}

export function SupportCard({ title, description, errorContext, className }: SupportCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          {title || "Need Help?"}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {errorContext && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorContext.message && <p className="font-semibold">{errorContext.message}</p>}
              {errorContext.details && <p className="text-sm mt-1">{errorContext.details}</p>}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground">
          If you're experiencing issues, please try refreshing the page or contact support.
        </p>
      </CardContent>
    </Card>
  )
}

