"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function signOutToHome() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithCredentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirectPath(
    formData.get("callbackUrl") != null ? String(formData.get("callbackUrl")) : null,
  );

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        redirect(`/signin?error=credentials&callbackUrl=${encodeURIComponent(redirectTo)}`);
      }
    }
    throw error;
  }
}

export async function signUpWithCredentials(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(
    formData.get("callbackUrl") != null ? String(formData.get("callbackUrl")) : null,
  );

  if (!name || !email || password.length < 8) {
    redirect(`/signup?error=invalid&callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`/signup?error=email_taken&callbackUrl=${encodeURIComponent(redirectTo)}`);
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/signin?callbackUrl=${encodeURIComponent(redirectTo)}`);
    }
    throw error;
  }
}
