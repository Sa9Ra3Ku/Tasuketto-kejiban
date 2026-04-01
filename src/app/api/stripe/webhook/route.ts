import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { SUPPORTER_PLAN_KEY } from "@/lib/subscription";

export const runtime = "nodejs";

function toDateFromUnix(seconds?: number | null): Date | null {
  if (!seconds) return null;
  return new Date(seconds * 1000);
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  const item = subscription.items.data[0];
  if (!item?.current_period_end) return null;
  return item.current_period_end;
}

async function applySubscriptionToUser(args: {
  userId?: string | null;
  customerId: string;
  subscriptionId: string;
  status: string;
  currentPeriodEnd?: number | null;
  planKey?: string | null;
}) {
  const targetPlanKey = args.planKey ?? SUPPORTER_PLAN_KEY;
  if (args.userId) {
    await prisma.user.update({
      where: { id: args.userId },
      data: {
        stripeCustomerId: args.customerId,
        stripeSubscriptionId: args.subscriptionId,
        subscriptionStatus: args.status,
        subscriptionCurrentPeriodEnd: toDateFromUnix(args.currentPeriodEnd),
        subscriptionPlanKey: targetPlanKey,
      },
    });
    return;
  }

  await prisma.user.updateMany({
    where: { stripeCustomerId: args.customerId },
    data: {
      stripeSubscriptionId: args.subscriptionId,
      subscriptionStatus: args.status,
      subscriptionCurrentPeriodEnd: toDateFromUnix(args.currentPeriodEnd),
      subscriptionPlanKey: targetPlanKey,
    },
  });
}

async function clearSubscriptionByCustomer(customerId: string) {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
      subscriptionPlanKey: null,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return new Response("Missing stripe signature configuration", { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (
        checkout.mode === "subscription" &&
        typeof checkout.customer === "string" &&
        typeof checkout.subscription === "string"
      ) {
        await applySubscriptionToUser({
          userId: checkout.client_reference_id,
          customerId: checkout.customer,
          subscriptionId: checkout.subscription,
          status: "active",
          planKey: checkout.metadata?.planKey ?? SUPPORTER_PLAN_KEY,
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        await applySubscriptionToUser({
          userId: subscription.metadata?.userId,
          customerId: subscription.customer,
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
          planKey: subscription.metadata?.planKey ?? SUPPORTER_PLAN_KEY,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        await clearSubscriptionByCustomer(subscription.customer);
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}

