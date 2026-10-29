export interface ReputationAccount {
  id: string;
  company_name: string;
  trustpilot_rating: number | null;
}

// Account-level ratings are not individual reviews or a provider-wide TrustScore.
export function accountReputation(accounts: readonly ReputationAccount[]) {
  const rated = accounts.filter(account => typeof account.trustpilot_rating === 'number'
    && Number.isFinite(account.trustpilot_rating) && account.trustpilot_rating >= 1 && account.trustpilot_rating <= 5);
  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = rated.filter(account => Math.round(account.trustpilot_rating!) === stars).length;
    return { stars, count, percentage: rated.length ? Math.round(count * 100 / rated.length) : 0 };
  });
  return {
    total: accounts.length,
    rated: rated.length,
    average: rated.length ? rated.reduce((sum, account) => sum + account.trustpilot_rating!, 0) / rated.length : null,
    distribution,
    followUp: [...rated].sort((a, b) => a.trustpilot_rating! - b.trustpilot_rating! || a.company_name.localeCompare(b.company_name)).slice(0, 10),
  };
}
