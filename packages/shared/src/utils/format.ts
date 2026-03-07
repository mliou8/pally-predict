// Convert lamports to a SOL string for display
export const formatSol = (lamports: number): string =>
  (lamports / 1_000_000_000).toFixed(4) + ' SOL'

// Shorten a wallet address: "AbCd...XyZ1"
export const truncateAddress = (address: string): string =>
  address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address

// Estimated payout for a bet given current odds
export const estimatedPayout = (betLamports: number, oddsPercent: number): number =>
  oddsPercent === 0 ? 0 : Math.floor(betLamports * (100 / oddsPercent))
