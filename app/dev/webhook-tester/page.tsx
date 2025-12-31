"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const samplePayloads = {
  "donation.created": {
    type: "donation.created",
    live_mode: false,
    attempt: 1,
    created: Math.floor(Date.now() / 1000),
    event_id: 1,
    data: {
      id: 58,
      amount: 5,
      object: "payment",
      status: "succeeded",
      message: "John bought you a coffee",
      currency: "USD",
      refunded: "false",
      created_at: Math.floor(Date.now() / 1000),
      note_hidden: "true",
      refunded_at: null,
      support_note: "Thanks for the good work",
      support_type: "Supporter",
      supporter_name: "John",
      supporter_name_type: "default",
      transaction_id: `pi_test_${Date.now()}`,
      application_fee: "0.25",
      supporter_id: 2345,
      supporter_email: "john@example.com",
      total_amount_charged: "5.45",
      coffee_count: 1,
      coffee_price: 5,
    },
  },
  "membership.started": {
    type: "membership.started",
    live_mode: false,
    attempt: 1,
    created: Math.floor(Date.now() / 1000),
    event_id: 2,
    data: {
      id: 100,
      membership_id: `mem_${Date.now()}`,
      membership_level_id: 1,
      membership_level_name: "Gold Member",
      status: "active",
      amount: 10,
      currency: "USD",
      supporter_id: 2345,
      supporter_name: "Jane Smith",
      supporter_email: "jane@example.com",
      started_at: Math.floor(Date.now() / 1000),
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      cancel_at_period_end: false,
    },
  },
  "subscription.created": {
    type: "subscription.created",
    live_mode: false,
    attempt: 1,
    created: Math.floor(Date.now() / 1000),
    event_id: 3,
    data: {
      id: 200,
      subscription_id: `sub_${Date.now()}`,
      plan_id: 5,
      plan_name: "Premium Plan",
      status: "active",
      amount: 15,
      currency: "USD",
      interval: "month",
      supporter_id: 2345,
      supporter_name: "Bob Wilson",
      supporter_email: "bob@example.com",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      cancel_at_period_end: false,
      created_at: Math.floor(Date.now() / 1000),
    },
  },
}

export default function WebhookTesterPage() {
  const [eventType, setEventType] = useState<keyof typeof samplePayloads>("donation.created")
  const [payload, setPayload] = useState(
    JSON.stringify({ providerId: "bmc", payload: samplePayloads["donation.created"] }, null, 2),
  )
  const [response, setResponse] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleEventTypeChange = (value: keyof typeof samplePayloads) => {
    setEventType(value)
    setPayload(JSON.stringify({ providerId: "bmc", payload: samplePayloads[value] }, null, 2))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/dev/simulate-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(JSON.stringify({ error: String(error) }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhook Tester</h1>
          <p className="text-muted-foreground">Test webhook processing without real payments</p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Back to Home
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Type</CardTitle>
            <CardDescription>Select a sample event type to test</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={eventType} onValueChange={handleEventTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donation.created">Donation Created</SelectItem>
                <SelectItem value="membership.started">Membership Started</SelectItem>
                <SelectItem value="subscription.created">Subscription Created</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Payload</CardTitle>
            <CardDescription>Edit the JSON payload to simulate different webhook events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payload">JSON Payload</Label>
              <Textarea
                id="payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="font-mono text-sm min-h-[400px]"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Test Webhook"}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
              <CardDescription>Server response from the webhook simulator</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                <code>{response}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Supported Event Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Donations:</strong>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>donation.created</li>
                  <li>donation.updated</li>
                  <li>donation.refunded</li>
                </ul>
              </div>
              <div>
                <strong>Memberships:</strong>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>membership.started</li>
                  <li>membership.renewed</li>
                  <li>membership.cancelled</li>
                  <li>membership.ended</li>
                </ul>
              </div>
              <div>
                <strong>Subscriptions:</strong>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>subscription.created</li>
                  <li>subscription.updated</li>
                  <li>subscription.cancelled</li>
                  <li>subscription.payment_succeeded</li>
                  <li>subscription.payment_failed</li>
                </ul>
              </div>
              <div>
                <strong>Other:</strong>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>extra.created</li>
                  <li>extra.updated</li>
                  <li>shop.order.created</li>
                  <li>shop.order.completed</li>
                  <li>shop.order.cancelled</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
