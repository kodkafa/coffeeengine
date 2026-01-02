export interface BmcWebhook<T = unknown> {
  type: BmcEventType
  live_mode: boolean
  attempt: number
  created: number
  event_id: number
  data: T
}

export type BmcEventType =
  | "donation.created"
  | "donation.updated"
  | "donation.refunded"
  | "membership.started"
  | "membership.renewed"
  | "membership.cancelled"
  | "membership.ended"
  | "extra.created"
  | "extra.updated"
  | "shop.order.created"
  | "shop.order.completed"
  | "shop.order.cancelled"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.cancelled"
  | "subscription.payment_succeeded"
  | "subscription.payment_failed"

export interface BmcDonationData {
  id: number
  amount: number
  object: "payment"
  status: "succeeded" | "processing" | "failed"
  message: string
  currency: string
  refunded: string // "true" or "false" as string
  created_at: number
  note_hidden: string // "true" or "false" as string
  refunded_at: number | null
  support_note: string
  support_type: "Supporter" | "Member"
  supporter_name: string
  supporter_name_type: "default" | "custom"
  transaction_id: string
  application_fee: string
  supporter_id: number
  supporter_email: string
  total_amount_charged: string
  coffee_count: number
  coffee_price: number
}

export interface BmcMembershipData {
  id: number
  membership_id: string
  membership_level_id: number
  membership_level_name: string
  status: "active" | "cancelled" | "expired"
  amount: number
  currency: string
  supporter_id: number
  supporter_name: string
  supporter_email: string
  started_at: number
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
}

export interface BmcExtraData {
  id: number
  amount: number
  currency: string
  supporter_id: number
  supporter_name: string
  supporter_email: string
  message: string
  created_at: number
}

export interface BmcShopOrderData {
  id: number
  order_id: string
  status: "pending" | "completed" | "cancelled" | "refunded"
  total_amount: number
  currency: string
  items: Array<{
    id: number
    name: string
    quantity: number
    price: number
  }>
  supporter_id: number
  supporter_name: string
  supporter_email: string
  shipping_address?: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  created_at: number
}

export interface BmcSubscriptionData {
  id: number
  subscription_id: string
  plan_id: number
  plan_name: string
  status: "active" | "cancelled" | "past_due" | "unpaid"
  amount: number
  currency: string
  interval: "month" | "year"
  supporter_id: number
  supporter_name: string
  supporter_email: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  created_at: number
}

export type BmcEventData = BmcDonationData | BmcMembershipData | BmcExtraData | BmcShopOrderData | BmcSubscriptionData

export type BmcDonationWebhook = BmcWebhook<BmcDonationData>
export type BmcMembershipWebhook = BmcWebhook<BmcMembershipData>
export type BmcExtraWebhook = BmcWebhook<BmcExtraData>
export type BmcShopOrderWebhook = BmcWebhook<BmcShopOrderData>
export type BmcSubscriptionWebhook = BmcWebhook<BmcSubscriptionData>
