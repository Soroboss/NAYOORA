"use client";

import { MemberWavePaymentButton } from "@/components/member-wave-payment-button";

export function WavePaymentButton({ contributionId, amountDue }: { contributionId: string; amountDue: number }) {
  return <MemberWavePaymentButton contributionId={contributionId} amount={amountDue} />;
}
