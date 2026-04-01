import { DeepDiveType, PrismaClient } from "@prisma/client";

import { getRelatedPosts } from "../../src/lib/posts";

const prisma = new PrismaClient();

export async function getPostFixture() {
  const post = await prisma.post.findFirst({
    where: {
      deepDives: {
        some: {},
      },
    },
    orderBy: {
      id: "asc",
    },
    include: {
      postTags: {
        include: {
          tag: true,
        },
      },
      deepDives: {
        orderBy: {
          id: "asc",
        },
        include: {
          user: true,
          _count: {
            select: {
              childDeepDives: true,
            },
          },
        },
      },
    },
  });

  if (!post || post.deepDives.length === 0) {
    throw new Error("E2E fixture post with deep dives was not found.");
  }

  return post;
}

export async function ensureFocusRootDeepDive(postId: number) {
  const existingRoot = await prisma.deepDive.findFirst({
    where: {
      postId,
      childDeepDives: {
        some: {},
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (existingRoot) return existingRoot;

  const parentCandidate = await prisma.deepDive.findFirst({
    where: {
      postId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!parentCandidate) {
    throw new Error("Cannot create focus root fixture without deep dives.");
  }

  const user = await prisma.user.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("Cannot create focus fixture without users.");
  }

  await prisma.deepDive.create({
    data: {
      postId,
      userId: user.id,
      parentDeepDiveId: parentCandidate.id,
      type: DeepDiveType.EMPATHY,
      body: "E2E focus fixture child deep dive",
    },
  });

  return parentCandidate;
}

export async function disconnectFixtureDb() {
  await prisma.$disconnect();
}

export async function getAyanoSavedActivityPostId() {
  const ayano = await prisma.user.findUnique({
    where: { email: "ayano@demo.local" },
    select: { id: true },
  });
  if (!ayano) throw new Error("Ayano fixture user was not found.");

  const saved = await prisma.savedPost.findMany({
    where: { userId: ayano.id },
    orderBy: { createdAt: "desc" },
    select: { postId: true, createdAt: true, lastSeenAt: true },
  });

  for (const row of saved) {
    const baseline = row.lastSeenAt ?? row.createdAt;
    const newCount = await prisma.deepDive.count({
      where: { postId: row.postId, createdAt: { gt: baseline } },
    });
    if (newCount > 0) return row.postId;
  }

  throw new Error("Saved flow activity fixture post was not found for Ayano.");
}

/** related の結果に targetPostId が含まれるような別投稿の id（E2E の近い流れ用） */
export async function getPostIdWhoseRelatedIncludes(targetPostId: number) {
  const posts = await prisma.post.findMany({ select: { id: true }, orderBy: { id: "asc" } });
  for (const { id } of posts) {
    if (id === targetPostId) continue;
    const related = await getRelatedPosts(id);
    if (related.some((item) => item.post.id === targetPostId)) return id;
  }
  throw new Error(`No post found whose related flows include post ${targetPostId}.`);
}

/** 彩乃のうち baseline 以降に深堀りが増えていない手元の流れ（discovery バッジ「手元に置いています」用） */
export async function getAyanoSavedWithoutNewActivityPostId() {
  const ayano = await prisma.user.findUnique({
    where: { email: "ayano@demo.local" },
    select: { id: true },
  });
  if (!ayano) throw new Error("Ayano fixture user was not found.");

  const saved = await prisma.savedPost.findMany({
    where: { userId: ayano.id },
    select: { postId: true, createdAt: true, lastSeenAt: true },
  });

  for (const row of saved) {
    const baseline = row.lastSeenAt ?? row.createdAt;
    const newCount = await prisma.deepDive.count({
      where: { postId: row.postId, createdAt: { gt: baseline } },
    });
    if (newCount === 0) return row.postId;
  }

  throw new Error("Ayano saved-without-activity fixture post was not found.");
}

/** 彩乃の「手元で新しく動いた流れ」代表 post における baseline より後の最新 deep dive */
export async function getAyanoSavedActivityLatestNewDeepDive() {
  const postId = await getAyanoSavedActivityPostId();
  const ayano = await prisma.user.findUnique({
    where: { email: "ayano@demo.local" },
    select: { id: true },
  });
  if (!ayano) throw new Error("Ayano fixture user was not found.");

  const saved = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId: ayano.id, postId } },
    select: { createdAt: true, lastSeenAt: true },
  });
  if (!saved) throw new Error("Ayano saved post fixture was not found.");

  const baseline = saved.lastSeenAt ?? saved.createdAt;
  const latest = await prisma.deepDive.findFirst({
    where: { postId, createdAt: { gt: baseline } },
    orderBy: { createdAt: "desc" },
    select: { id: true, body: true },
  });
  if (!latest) {
    throw new Error("No new deep dive after baseline for Ayano saved activity fixture.");
  }

  return { postId, deepDiveId: latest.id, bodySnippet: latest.body.slice(0, 24) };
}

export async function createModerationFixture() {
  const ayano = await prisma.user.findUnique({
    where: { email: "ayano@demo.local" },
    select: { id: true },
  });
  if (!ayano) throw new Error("Ayano fixture user was not found.");

  const tag = await prisma.tag.upsert({
    where: { name: "e2e-moderation" },
    update: {},
    create: { name: "e2e-moderation" },
    select: { id: true },
  });

  const post = await prisma.post.create({
    data: {
      title: `E2E moderation flow ${Date.now()}`,
      body: "E2E用のモデレーション確認投稿です。",
      type: "ISSUE",
      authorId: ayano.id,
      postTags: {
        create: [{ tagId: tag.id }],
      },
    },
    select: { id: true },
  });

  const deepDive = await prisma.deepDive.create({
    data: {
      postId: post.id,
      userId: ayano.id,
      type: DeepDiveType.EMPATHY,
      body: "E2E用のモデレーション確認角度です。",
    },
    select: { id: true },
  });

  return { postId: post.id, deepDiveId: deepDive.id };
}
