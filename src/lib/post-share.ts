import { PostType } from "@prisma/client";

import { excerpt } from "@/lib/format";
import { postTypeLabels } from "@/lib/labels";

type SharePostInput = {
  title: string;
  body: string;
  type: PostType;
  tags: string[];
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function buildPostShareText(post: SharePostInput): string {
  const bodySummary = excerpt(normalizeText(post.body), 56);
  return `助けっ人掲示板で見つけた流れです。\n「${post.title}」(${postTypeLabels[post.type]})\n${bodySummary}`;
}

export function buildPostMetadataDescription(post: SharePostInput): string {
  const bodySummary = excerpt(normalizeText(post.body), 90);
  const tags = post.tags.slice(0, 3).join(" / ");
  const tagLine = tags.length > 0 ? `タグ: ${tags}` : null;
  const parts = [`${postTypeLabels[post.type]}の流れ「${post.title}」`, bodySummary, tagLine].filter(Boolean);
  return parts.join("。");
}
