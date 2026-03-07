export type MarketStatus = 'open' | 'resolved' | 'cancelled'

export type MarketOption = {
  label: string
  totalBetsLamports: number
  oddsPercent: number        // 0–100, calculated on the backend
}

export type Market = {
  id: string
  title: string              // e.g. "Will SOL hit $500 by end of year?"
  description: string
  creatorWallet: string      // base58 Solana public key
  options: MarketOption[]    // min 2, max 6 custom labels
  resolvesAt: number         // Unix timestamp
  status: MarketStatus
  resolvedOption?: string
  totalPoolLamports: number
  onChainAddress: string     // Solana account address for this market (PDA)
  seekerExclusive?: boolean  // If true, shows Seeker Bonus badge
}

export type Bet = {
  marketId: string
  walletAddress: string
  option: string
  amountLamports: number
  txSignature: string
  placedAt: number           // Unix timestamp
}
