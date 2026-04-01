const toBoolean = (value: string | undefined) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
export const adsEnabled = toBoolean(process.env.NEXT_PUBLIC_ENABLE_ADS) && adsenseClient.length > 0;
