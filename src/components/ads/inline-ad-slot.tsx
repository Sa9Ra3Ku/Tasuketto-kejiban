import { AdSlot } from "@/components/ads/ad-slot";

type InlineAdSlotProps = {
  slot?: string;
  testId?: string;
  className?: string;
};

export function InlineAdSlot({ slot, testId, className }: InlineAdSlotProps) {
  return <AdSlot slot={slot} testId={testId} className={className} label="広告" />;
}
