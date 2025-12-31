// Replace string literals with enums for compile-time type safety

export enum CoffeeProvider {
  BMC = "bmc",
}

export enum CoffeeEventType {
  // Donation events
  DONATION_CREATED = "donation.created",
  DONATION_UPDATED = "donation.updated",
  DONATION_REFUNDED = "donation.refunded",

  // Membership events
  MEMBERSHIP_STARTED = "membership.started",
  MEMBERSHIP_RENEWED = "membership.renewed",
  MEMBERSHIP_CANCELLED = "membership.cancelled",
  MEMBERSHIP_ENDED = "membership.ended",

  // Extra events
  EXTRA_CREATED = "extra.created",
  EXTRA_UPDATED = "extra.updated",

  // Shop order events
  SHOP_ORDER_CREATED = "shop.order.created",
  SHOP_ORDER_COMPLETED = "shop.order.completed",
  SHOP_ORDER_CANCELLED = "shop.order.cancelled",

  // Subscription events
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_UPDATED = "subscription.updated",
  SUBSCRIPTION_CANCELLED = "subscription.cancelled",
  SUBSCRIPTION_PAYMENT_SUCCEEDED = "subscription.payment_succeeded",
  SUBSCRIPTION_PAYMENT_FAILED = "subscription.payment_failed",
}
