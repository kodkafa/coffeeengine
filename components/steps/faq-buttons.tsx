"use client"

import { Button } from "@/components/ui/button"
import type { StepComponentProps } from "@/types/chat-ui"

export function FAQButtons({ onSendMessage, config }: StepComponentProps) {
    if (!config?.faq) {
        return null
    }

    const handleFAQClick = async (question: string) => {
        await onSendMessage(question)
    }

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {config.faq.map((faq) => (
                <Button
                    key={faq.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleFAQClick(faq.question)}
                >
                    {faq.label}
                </Button>
            ))}
        </div>
    )
}
