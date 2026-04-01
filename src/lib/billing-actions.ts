"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl, getStripe, getStripePriceIdSupporter } from "@/lib/stripe";
import { SUPPORTER_PLAN_KEY } from "@/lib/subscription";

export async function createSupporterCheckoutSessionAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/pricing")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/pricing")}`);
  }

  const stripe = getStripe();
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const baseUrl = getBaseUrl();
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: user.id,
    line_items: [
      {
        price: getStripePriceIdSupporter(),
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      planKey: SUPPORTER_PLAN_KEY,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planKey: SUPPORTER_PLAN_KEY,
      },
    },
    success_url: `${baseUrl}/billing?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancel`,
  });

  if (!checkout.url) {
    throw new Error("Failed to create checkout session.");
  }
  redirect(checkout.url);
}

export async function createBillingPortalSessionAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/billing")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    redirect("/billing?portal=unavailable");
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getBaseUrl()}/billing`,
  });
  redirect(portal.url);
}

