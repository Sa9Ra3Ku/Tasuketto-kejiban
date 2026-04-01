import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { postTypeLabels } from "@/lib/labels";
import { PostCardModel } from "@/lib/posts";
import type { SavedHandDiscoveryState } from "@/lib/saved-post-discovery";

type Props = {
  post: PostCardModel;
  href?: string;
  /** ログイン中のみ。saved +  activity は new を優先して1種類だけ */
  handDiscovery?: SavedHandDiscoveryState;
};

export function PostCard({ post, href, handDiscovery }: Props) {
  const handLabel =
    handDiscovery === "new_activity"
      ? "手元で新しく動いています"
      : handDiscovery === "on_hand"
        ? "手元に置いています"
        : null;

  return (
    <Link
      href={href ?? `/posts/${post.id}`}
      className="block"
      data-testid={`post-card-link-${post.id}`}
    >
      <Card className="border-zinc-200 transition hover:border-zinc-300 hover:bg-zinc-50/70">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-sm font-semibold leading-6">{post.title}</h2>
            <Badge variant="secondary">{postTypeLabels[post.type]}</Badge>
          </div>

          {handLabel ? (
            <p
              className={
                handDiscovery === "new_activity"
                  ? "-mt-1 text-xs font-medium text-emerald-700/85"
                  : "-mt-1 text-xs text-zinc-500"
              }
              data-testid="post-card-hand-discovery"
              data-hand-kind={handDiscovery}
            >
              {handLabel}
            </p>
          ) : null}

          <p className="text-sm leading-6 text-zinc-600">
            {post.isHidden ? "この流れは現在見えないようにしています。" : excerpt(post.body, 95)}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {post.postTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
              >
                #{tag.name}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>深堀り {post._count.deepDives}</span>
            <span>{formatDateTimeJP(post.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
