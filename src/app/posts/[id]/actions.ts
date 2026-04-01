"use server";

import { DeepDiveType, ReportReasonKey, ReportTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  appendDiscoveryContextToSearchParams,
  DiscoveryContext,
} from "@/lib/discovery-context";
import { prisma } from "@/lib/prisma";
import {
  REALTIME_EVENT_DEEPDIVE_CREATED,
  REALTIME_EVENT_ME_REFRESH,
  postChannelName,
  userChannelName,
} from "@/lib/realtime-channels";
import { publishRealtimeEvent } from "@/lib/realtime-server";

export type DeepDiveFormState = {
  errors?: {
    type?: string;
    body?: string;
    targetMode?: string;
    parentDeepDiveId?: string;
    form?: string;
  };
  values?: {
    type: string;
    body: string;
    targetMode: string;
    parentDeepDiveId: string;
  };
};

const MIN_BODY_LENGTH = 3;
const REPORT_COOLDOWN_MINUTES = 30;

export type ReportFormState = {
  success?: string;
  errors?: {
    reasonKey?: string;
    note?: string;
    form?: string;
  };
};

export async function savePostAction(postId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/posts/${postId}`)}`);
  }

  await prisma.savedPost.upsert({
    where: {
      userId_postId: {
        userId: session.user.id,
        postId,
      },
    },
    create: {
      userId: session.user.id,
      postId,
    },
    update: {},
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");
}

export async function unsavePostAction(postId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/posts/${postId}`)}`);
  }

  await prisma.savedPost.deleteMany({
    where: {
      userId: session.user.id,
      postId,
    },
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");
}

export async function markSavedPostSeenAction(postId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/posts/${postId}`)}`);
  }

  await prisma.savedPost.updateMany({
    where: {
      userId: session.user.id,
      postId,
    },
    data: {
      lastSeenAt: new Date(),
    },
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");
}

export async function createReportAction(postId: number, _prevState: ReportFormState, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      errors: { form: "入ってから運営に知らせてください。" },
    } satisfies ReportFormState;
  }

  const targetTypeRaw = String(formData.get("targetType") ?? "").trim();
  const reasonRaw = String(formData.get("reasonKey") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();
  const targetDeepDiveIdRaw = String(formData.get("targetDeepDiveId") ?? "").trim();

  const targetType = targetTypeRaw === "DEEPDIVE" ? ReportTargetType.DEEPDIVE : ReportTargetType.POST;
  if (!Object.values(ReportReasonKey).includes(reasonRaw as ReportReasonKey)) {
    return { errors: { reasonKey: "理由を選んでください。" } } satisfies ReportFormState;
  }

  if (noteRaw.length > 600) {
    return { errors: { note: "補足は600文字以内でお願いします。" } } satisfies ReportFormState;
  }

  const targetDeepDiveId = Number(targetDeepDiveIdRaw);
  if (targetType === ReportTargetType.DEEPDIVE && (Number.isNaN(targetDeepDiveId) || targetDeepDiveId <= 0)) {
    return { errors: { form: "知らせる対象が見つかりませんでした。" } } satisfies ReportFormState;
  }

  if (targetType === ReportTargetType.POST) {
    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!targetPost) return { errors: { form: "対象の流れが見つかりませんでした。" } } satisfies ReportFormState;
  } else {
    const targetDeepDive = await prisma.deepDive.findUnique({
      where: { id: targetDeepDiveId },
      select: { id: true, postId: true },
    });
    if (!targetDeepDive || targetDeepDive.postId !== postId) {
      return { errors: { form: "対象の角度が見つかりませんでした。" } } satisfies ReportFormState;
    }
  }

  const cooldownSince = new Date(Date.now() - REPORT_COOLDOWN_MINUTES * 60_000);
  const recent = await prisma.report.findFirst({
    where: {
      reporterUserId: session.user.id,
      targetType,
      ...(targetType === ReportTargetType.POST ? { targetPostId: postId } : { targetDeepDiveId }),
      createdAt: { gte: cooldownSince },
    },
    select: { id: true },
  });
  if (recent) {
    return {
      errors: { form: "同じ内容は少し時間をおいてから知らせてください。" },
    } satisfies ReportFormState;
  }

  await prisma.report.create({
    data: {
      reporterUserId: session.user.id,
      targetType,
      targetPostId: targetType === ReportTargetType.POST ? postId : null,
      targetDeepDiveId: targetType === ReportTargetType.DEEPDIVE ? targetDeepDiveId : null,
      reasonKey: reasonRaw as ReportReasonKey,
      note: noteRaw || null,
    },
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/admin/reports");
  return { success: "運営へ伝えました。" } satisfies ReportFormState;
}

export async function createDeepDive(
  postId: number,
  currentFilterType: string | null,
  currentFocusFromDeepDiveId: string | null,
  discoveryContext: DiscoveryContext,
  workbenchContext:
    | {
        source: "me";
        flow: "easyReply";
        returnTo: "me";
      }
    | null,
  _prevState: DeepDiveFormState,
  formData: FormData,
): Promise<DeepDiveFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      errors: { form: "入ってから深堀りを重ねてください。" },
      values: {
        type: "",
        body: "",
        targetMode: "post",
        parentDeepDiveId: "",
      },
    };
  }

  const userId = session.user.id;

  const type = String(formData.get("type") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const targetModeRaw = String(formData.get("targetMode") ?? "").trim();
  const parentDeepDiveIdRaw = String(formData.get("parentDeepDiveId") ?? "").trim();

  const values = {
    type,
    body,
    targetMode: targetModeRaw,
    parentDeepDiveId: parentDeepDiveIdRaw,
  };

  const hasParent = parentDeepDiveIdRaw.length > 0;
  const parentDeepDiveId = Number(parentDeepDiveIdRaw);
  const targetMode = ["post", "focusRoot", "deepDive"].includes(targetModeRaw)
    ? targetModeRaw
    : "post";

  if (!Object.values(DeepDiveType).includes(type as DeepDiveType)) {
    return {
      errors: { type: "深堀り種別を選択してください。" },
      values,
    };
  }

  if (!body) {
    return {
      errors: { body: "本文を入力してください。" },
      values,
    };
  }

  if (body.length < MIN_BODY_LENGTH) {
    return {
      errors: { body: "本文は3文字以上で入力してください。" },
      values,
    };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, isHidden: true },
  });

  if (!post) {
    return { errors: { form: "投稿が見つかりませんでした。" }, values };
  }
  if (post.isHidden) {
    return { errors: { form: "この流れは現在見えないようにしています。" }, values };
  }

  const hasFocusRootCandidate = Boolean(currentFocusFromDeepDiveId);
  const focusRootDeepDiveId = Number(currentFocusFromDeepDiveId);
  const hasValidFocusRootCandidate =
    hasFocusRootCandidate && !Number.isNaN(focusRootDeepDiveId) && focusRootDeepDiveId > 0;

  if (hasParent && (Number.isNaN(parentDeepDiveId) || parentDeepDiveId <= 0)) {
    return {
      errors: { parentDeepDiveId: "重ね先の深堀り指定が不正です。" },
      values,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return { errors: { form: "ユーザー情報を確認できませんでした。もう一度入り直してください。" }, values };
  }

  let focusRootDeepDive: { id: number; postId: number; isHidden: boolean } | null = null;
  if (hasValidFocusRootCandidate) {
    focusRootDeepDive = await prisma.deepDive.findUnique({
      where: { id: focusRootDeepDiveId },
      select: { id: true, postId: true, isHidden: true },
    });
  }

  if (hasFocusRootCandidate && !focusRootDeepDive) {
    return {
      errors: { targetMode: "流れの起点を確認できなかったため、投稿対象を選び直してください。" },
      values,
    };
  }
  if (focusRootDeepDive?.isHidden) {
    return {
      errors: { targetMode: "この起点は現在見えないため、投稿全体に重ねてください。" },
      values,
    };
  }

  if (focusRootDeepDive && focusRootDeepDive.postId !== postId) {
    return {
      errors: { targetMode: "この投稿ではない流れの起点は選べません。" },
      values,
    };
  }

  let selectedParentDeepDive: { id: number; postId: number; userId: string; isHidden: boolean } | null =
    null;
  if (hasParent) {
    selectedParentDeepDive = await prisma.deepDive.findUnique({
      where: { id: parentDeepDiveId },
      select: { id: true, postId: true, userId: true, isHidden: true },
    });

    if (!selectedParentDeepDive) {
      return {
        errors: { parentDeepDiveId: "重ね先の深堀りが見つかりません。" },
        values,
      };
    }

    if (selectedParentDeepDive.postId !== postId) {
      return {
        errors: { parentDeepDiveId: "別の投稿の深堀りには重ねられません。" },
        values,
      };
    }
    if (selectedParentDeepDive.isHidden) {
      return {
        errors: { parentDeepDiveId: "この角度は現在見えないため、別の重ね先を選んでください。" },
        values,
      };
    }
  }

  if (targetMode === "focusRoot" && !focusRootDeepDive) {
    return {
      errors: { targetMode: "この流れの起点が見つからないため、投稿全体に重ねるを選んでください。" },
      values,
    };
  }

  if (targetMode === "deepDive" && !selectedParentDeepDive) {
    return {
      errors: {
        parentDeepDiveId: "重ねる深堀りが選ばれていません。対象を選び直してください。",
      },
      values,
    };
  }

  const parentDeepDiveIdToSave =
    targetMode === "post"
      ? null
      : targetMode === "focusRoot"
        ? focusRootDeepDive!.id
        : selectedParentDeepDive!.id;

  const createdDeepDive = await prisma.$transaction(async (tx) => {
    const deepDive = await tx.deepDive.create({
      data: {
        postId,
        userId: user.id,
        parentDeepDiveId: parentDeepDiveIdToSave,
        type: type as DeepDiveType,
        body,
      },
    });

    await tx.post.update({
      where: { id: postId },
      data: {
        updatedAt: new Date(),
      },
    });

    return deepDive;
  });

  const impactedAudience = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      savedBy: {
        select: { userId: true },
      },
    },
  });

  const impactedUserIds = new Set<string>([
    impactedAudience?.authorId ?? "",
    selectedParentDeepDive?.userId ?? "",
    ...((impactedAudience?.savedBy ?? []).map((saved) => saved.userId) ?? []),
  ]);
  impactedUserIds.delete("");

  const createdPayload = {
    type: REALTIME_EVENT_DEEPDIVE_CREATED,
    postId,
    deepDiveId: createdDeepDive.id,
    createdAt: createdDeepDive.createdAt.toISOString(),
  } as const;

  await publishRealtimeEvent(
    postChannelName(postId),
    REALTIME_EVENT_DEEPDIVE_CREATED,
    createdPayload,
  );

  await Promise.all(
    [...impactedUserIds].map((targetUserId) =>
      publishRealtimeEvent(userChannelName(targetUserId), REALTIME_EVENT_ME_REFRESH, {
        type: REALTIME_EVENT_ME_REFRESH,
        postId,
        deepDiveId: createdDeepDive.id,
        createdAt: createdDeepDive.createdAt.toISOString(),
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");

  if (workbenchContext?.source === "me" && workbenchContext.flow === "easyReply") {
    const workbenchParams = new URLSearchParams();
    workbenchParams.set("fromPostedWorkbench", "1");
    workbenchParams.set("postedFrom", workbenchContext.flow);
    redirect(`/me?${workbenchParams.toString()}#me-easy-reply`);
  }

  const params = new URLSearchParams();
  if (currentFilterType) params.set("type", currentFilterType);
  if (currentFocusFromDeepDiveId) params.set("focusFromDeepDiveId", currentFocusFromDeepDiveId);
  params.set("composeDiveType", type);
  params.set("composeTarget", currentFocusFromDeepDiveId ? "focusRoot" : "post");
  appendDiscoveryContextToSearchParams(params, discoveryContext);
  const redirectPath =
    params.toString().length > 0
      ? `/posts/${postId}?${params.toString()}`
      : `/posts/${postId}`;
  redirect(redirectPath);
}
