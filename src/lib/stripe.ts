import Stripe from "stripe";

import { getSiteUrl } from "@/lib/site";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripePriceIdSupporter(): string {
  const priceId = process.env.STRIPE_PRICE_ID_SUPPORTER;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID_SUPPORTER is not set.");
  }
  return priceId;
}

export function getBaseUrl(): string {
  return getSiteUrl().replace(/\/$/, "");
}

