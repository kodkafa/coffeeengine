import { AIChat } from "@/components/ai-chat"

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full">
      <div className="flex-1 flex flex-col min-h-0 container mx-auto p-6 max-w-4xl w-full h-full">
        <AIChat
          systemPrompt="You are a helpful AI assistant powered by Coffee Engine. You help users unlock premium features through verified payments. Be friendly, professional, and guide users through the verification process when needed."
        />
      </div>
    </div>
  )
}
