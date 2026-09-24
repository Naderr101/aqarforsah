import { platformConfig } from "@/config/platform";
import type { ExitOpportunity } from "@/types/opportunity";

export interface ExitFinancials {
  exitAmount: number;
  verifiedPaidAmount?: number;
  remainingDeveloperBalance: number;
  transactionValue: number;
  platformFee: number;
  marketValue?: number;
  estimatedSaving?: number;
}

export function computeExitFinancials(
  o: Pick<ExitOpportunity, "exitAmount" | "remainingDeveloperBalance" | "marketValue" | "verifiedPaidAmount">,
  feeRate: number = platformConfig.exitPlatformFeeRate,
): ExitFinancials {
  const transactionValue = o.exitAmount + o.remainingDeveloperBalance;
  const platformFee = Math.round(transactionValue * feeRate);
  const estimatedSaving =
    o.marketValue !== undefined ? o.marketValue - transactionValue - platformFee : undefined;
  return {
    exitAmount: o.exitAmount,
    verifiedPaidAmount: o.verifiedPaidAmount,
    remainingDeveloperBalance: o.remainingDeveloperBalance,
    transactionValue,
    platformFee,
    marketValue: o.marketValue,
    estimatedSaving: estimatedSaving !== undefined && estimatedSaving > 0 ? estimatedSaving : undefined,
  };
}

export const formatMoney = (n: number) => `${new Intl.NumberFormat("ar-EG").format(n)} ${platformConfig.currencyLabel}`;
export const formatNumber = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
