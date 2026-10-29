import { accountReputation } from '@/lib/accountReputation';
import type { ReputationAccount } from '@/lib/accountReputation';

export function customerSuccessStats(accounts: readonly (ReputationAccount & {
  subscription_status: string | null; risk_level: string | null; payment_status: string | null;
})[]) {
  return {
    totalUsers: accounts.length,
    activeUsers: accounts.filter(account => account.subscription_status === 'active').length,
    atRiskUsers: accounts.filter(account => account.risk_level === 'high' || account.risk_level === 'critical').length,
    unpaidUsers: accounts.filter(account => ['late', 'overdue', 'critical'].includes(account.payment_status || '')).length,
    averageRating: accountReputation(accounts).average,
  };
}
