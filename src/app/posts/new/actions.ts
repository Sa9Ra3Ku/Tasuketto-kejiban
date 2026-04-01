"use server";

import { PostType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizeTags(raw: string): string[] {
  return raw
    .split(/[,\s、]+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim() as PostType;
  const tags = normalizeTags(String(formData.get("tags") ?? ""));

  if (!title || !body || !Object.values(PostType).includes(type)) {
    return;
  }

  const created = await prisma.post.create({
    data: {
      title,
      body,
      type,
      authorId: session.user.id,
    },
    select: { id: true },
  });

  for (const tagName of tags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
      select: { id: true },
    });

    await prisma.postTag.upsert({
      where: {
        postId_tagId: {
          postId: created.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        postId: created.id,
        tagId: tag.id,
      },
    });
  }

  revalidatePath("/");
  redirect("/");
}
