"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markIncomingOverlapsSeenAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/me")}`);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { incomingOverlapsSeenAt: new Date() },
  });

  revalidatePath("/me");
  revalidatePath("/", "layout");
  redirect("/me");
}
