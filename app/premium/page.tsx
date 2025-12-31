"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatInterface } from "@/components/chat-interface"
import { AIChat } from "@/components/ai-chat"
import { Zap, Bot, Lock } from "lucide-react"

export default function PremiumPage() {
  const [apiKey, setApiKey] = useState("")
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic" | "vercel">("openai")

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-yellow-600" />
            <h1 className="text-4xl font-bold">Coffee Engine Premium</h1>
          </div>
          <p className="text-lg text-muted-foreground">Verify your payment and unlock premium AI-powered features</p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <Bot className="h-6 w-6 text-blue-600 mb-2" />
              <CardTitle className="text-lg">AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chat with a personalized AI assistant powered by your preferred AI provider
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-6 w-6 text-green-600 mb-2" />
              <CardTitle className="text-lg">Verified Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Payment verification ensures secure access to premium content and features
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Flexible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bring your own AI keys or use Vercel's AI Gateway for a seamless experience
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Configure your AI provider for premium chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="openai">OpenAI (Enter your API key below)</option>
                <option value="anthropic">Anthropic Claude (Enter your API key below)</option>
                <option value="vercel">Vercel AI Gateway (Requires environment setup)</option>
              </select>
            </div>

            {aiProvider !== "vercel" && (
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  {aiProvider === "openai" ? "OpenAI API Key" : "Anthropic API Key"}
                </label>
                <input
                  id="api-key"
                  type="password"
                  placeholder={`Enter your ${aiProvider === "openai" ? "OpenAI" : "Anthropic"} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Your API key stays in your browser and is never sent to our servers (except to your AI provider)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Chat</TabsTrigger>
            <TabsTrigger value="ai">AI-Powered Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Verification Flow</CardTitle>
                <CardDescription>A simple chat interface that unlocks after payment verification</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface systemPrompt="You are a helpful assistant integrated with Coffee Engine" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Premium AI Chat</CardTitle>
                <CardDescription>
                  Full-featured AI chat with your preferred provider {aiProvider && `(${aiProvider})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiKey || aiProvider === "vercel" ? (
                  <AIChat apiKey={apiKey} />
                ) : (
                  <div className="p-8 text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {`Please enter your ${aiProvider === "openai" ? "OpenAI" : "Anthropic"} API key above to enable AI chat`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>✓ Payment verification happens on Coffee Engine servers only</p>
            <p>✓ Your AI API keys stay in your browser (never sent to Coffee Engine)</p>
            <p>✓ All communications are encrypted over HTTPS</p>
            <p>✓ No personal data is stored or logged by Coffee Engine</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
