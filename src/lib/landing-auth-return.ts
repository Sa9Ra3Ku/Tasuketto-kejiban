const LANDING_AUTH_CONTEXT = "sharedPost";

export const LANDING_AUTH_QUERY_KEY = "fromLandingAuth";
export const RETURNED_FROM_AUTH_QUERY_KEY = "returnedFromAuth";

export function buildPostPathForLandingAuthReturn(postId: number): string {
  const params = new URLSearchParams();
  params.set(LANDING_AUTH_QUERY_KEY, "1");
  params.set(RETURNED_FROM_AUTH_QUERY_KEY, LANDING_AUTH_CONTEXT);
  return `/posts/${postId}?${params.toString()}`;
}

export function isReturnedFromSharedLandingAuth(params: {
  fromLandingAuth?: string;
  returnedFromAuth?: string;
}): boolean {
  return params.fromLandingAuth === "1" && params.returnedFromAuth === LANDING_AUTH_CONTEXT;
}
