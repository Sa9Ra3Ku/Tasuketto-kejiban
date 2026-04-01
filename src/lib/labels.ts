import { DeepDiveType, PostType } from "@prisma/client";

export const postTypeLabels: Record<PostType, string> = {
  WORRY: "悩み",
  ISSUE: "課題",
  DEDUCTION: "推理",
  HYPOTHESIS: "仮説",
  PREDICTION: "予想",
};

export const deepDiveTypeLabels: Record<DeepDiveType, string> = {
  EMPATHY: "共感",
  PERSPECTIVE: "視点",
  HYPOTHESIS: "仮説",
  DEDUCTION: "推理",
  REBUTTAL: "反証",
  SUMMARY: "整理",
  EXPERIENCE: "体験",
};
