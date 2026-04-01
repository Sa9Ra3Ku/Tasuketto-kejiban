import { auth } from "@/auth";

function readAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

export async function getAdminSession() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  const isAdmin = email.length > 0 && readAdminEmails().includes(email);
  return { session, isAdmin };
}

