export const SUPPORTER_PLAN_KEY = "supporter";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type MemberSnapshot = {
  subscriptionPlanKey?: string | null;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
};

export function isSupporterMember(snapshot: MemberSnapshot): boolean {
  if (snapshot.subscriptionPlanKey !== SUPPORTER_PLAN_KEY) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(snapshot.subscriptionStatus ?? "");
}

export function membershipLabel(snapshot: MemberSnapshot): string {
  if (isSupporterMember(snapshot)) return "サポーター";
  return "無料";
}

