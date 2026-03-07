// Shared API client — used by both /apps/web and /apps/mobile
// Base URL is injected so each app can provide its own (web uses relative, mobile uses absolute)

import type { Market, Bet } from '../types/market'

export const createApiClient = (baseUrl: string) => ({
  getMarkets: async (status = 'open'): Promise<Market[]> => {
    const res = await fetch(`${baseUrl}/api/markets?status=${status}`)
    if (!res.ok) throw new Error('Failed to fetch markets')
    return res.json()
  },
  getMarket: async (id: string): Promise<Market> => {
    const res = await fetch(`${baseUrl}/api/markets/${id}`)
    if (!res.ok) throw new Error('Failed to fetch market')
    return res.json()
  },
  createMarket: async (body: {
    title: string
    description: string
    options: string[]
    resolvesAt: number
    creatorWallet: string
    onChainAddress: string
    txSignature: string
  }): Promise<Market> => {
    const res = await fetch(`${baseUrl}/api/markets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Failed to create market')
    return res.json()
  },
  getBets: async (walletAddress: string): Promise<Bet[]> => {
    const res = await fetch(`${baseUrl}/api/bets?wallet=${walletAddress}`)
    if (!res.ok) throw new Error('Failed to fetch bets')
    return res.json()
  },
  recordBet: async (body: {
    marketId: string
    walletAddress: string
    option: string
    amountLamports: number
    txSignature: string
  }): Promise<Bet> => {
    const res = await fetch(`${baseUrl}/api/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Failed to record bet')
    return res.json()
  },
})
