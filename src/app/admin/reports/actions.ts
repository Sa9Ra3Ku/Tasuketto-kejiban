"use server";

import { ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

async function requireAdminUser() {
  const { session, isAdmin } = await getAdminSession();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin%2Freports");
  }
  if (!isAdmin) {
    redirect("/");
  }
}

export async function updateReportStatusAction(reportId: number, status: ReportStatus) {
  await requireAdminUser();
  await prisma.report.update({
    where: { id: reportId },
    data: { status },
  });
  revalidatePath("/admin/reports");
}

export async function hidePostFromReportAction(postId: number, reportId: number) {
  await requireAdminUser();
  await prisma.$transaction([
    prisma.post.update({
      where: { id: postId },
      data: {
        isHidden: true,
        hiddenReason: "管理確認により一時非表示",
        hiddenAt: new Date(),
      },
    }),
    prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.REVIEWED },
    }),
  ]);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");
  revalidatePath("/admin/reports");
}

export async function hideDeepDiveFromReportAction(deepDiveId: number, postId: number, reportId: number) {
  await requireAdminUser();
  await prisma.$transaction([
    prisma.deepDive.update({
      where: { id: deepDiveId },
      data: {
        isHidden: true,
        hiddenReason: "管理確認により一時非表示",
        hiddenAt: new Date(),
      },
    }),
    prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.REVIEWED },
    }),
  ]);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/me");
  revalidatePath("/admin/reports");
}

