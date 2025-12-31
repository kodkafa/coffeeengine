"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NormalizedEvent {
  providerId: string
  eventType: string
  externalId: string
  amountMinor: number
  currency: string
  payerEmail?: string
  occurredAt: string
  eventMetadata?: Record<string, unknown>
  storedAt?: number
}

interface EventStats {
  totalEvents: number
  eventTypeBreakdown: Record<string, number>
  totalRevenue: number
  totalRevenueFormatted: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [emailFilter, setEmailFilter] = useState<string>("")

  const loadStats = async () => {
    try {
      const res = await fetch("/api/events/stats?providerId=bmc")
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const loadEvents = async () => {
    setLoading(true)
    try {
      let url = "/api/events?providerId=bmc&limit=50"

      if (eventTypeFilter !== "all") {
        url += `&eventType=${eventTypeFilter}`
      }

      if (emailFilter.trim()) {
        url += `&email=${encodeURIComponent(emailFilter.trim())}`
      }

      const res = await fetch(url)
      const data = await res.json()
      setEvents(data.events)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadEvents()
  }, [])

  const handleFilterChange = () => {
    loadEvents()
  }

  const getEventColor = (eventType: string) => {
    if (eventType.startsWith("donation")) return "bg-green-500"
    if (eventType.startsWith("membership")) return "bg-blue-500"
    if (eventType.startsWith("subscription")) return "bg-purple-500"
    if (eventType.startsWith("shop")) return "bg-orange-500"
    if (eventType.startsWith("extra")) return "bg-pink-500"
    return "bg-gray-500"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Browser</h1>
          <p className="text-muted-foreground">View and analyze all webhook events</p>
        </div>
        <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRevenueFormatted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.eventTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter Events</CardTitle>
          <CardDescription>Filter events by type or supporter email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="donation.created">Donation Created</SelectItem>
                  <SelectItem value="donation.updated">Donation Updated</SelectItem>
                  <SelectItem value="donation.refunded">Donation Refunded</SelectItem>
                  <SelectItem value="membership.started">Membership Started</SelectItem>
                  <SelectItem value="membership.renewed">Membership Renewed</SelectItem>
                  <SelectItem value="subscription.created">Subscription Created</SelectItem>
                  <SelectItem value="shop.order.created">Shop Order Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supporter Email</Label>
              <Input
                placeholder="john@example.com"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleFilterChange} className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No events found</p>
            ) : (
              events.map((event, idx) => (
                <Card
                  key={idx}
                  className="border-l-4"
                  style={{ borderLeftColor: getEventColor(event.eventType).replace("bg-", "#") }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getEventColor(event.eventType)}>{event.eventType}</Badge>
                          <span className="text-sm text-muted-foreground">{event.externalId}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>{" "}
                            <span className="font-medium">
                              ${(event.amountMinor / 100).toFixed(2)} {event.currency}
                            </span>
                          </div>
                          {event.payerEmail && (
                            <div>
                              <span className="text-muted-foreground">Email:</span>{" "}
                              <span className="font-medium">{event.payerEmail}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Occurred:</span>{" "}
                            <span className="font-medium">{new Date(event.occurredAt).toLocaleString()}</span>
                          </div>
                          {event.storedAt && (
                            <div>
                              <span className="text-muted-foreground">Stored:</span>{" "}
                              <span className="font-medium">{new Date(event.storedAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {event.eventMetadata && Object.keys(event.eventMetadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                              View metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(event.eventMetadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
