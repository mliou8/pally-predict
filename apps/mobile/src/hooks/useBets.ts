import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient, Bet } from '@predictsol/shared'
import { API_BASE_URL } from '../constants'
import { useWallet } from './useWallet'

const apiClient = createApiClient(API_BASE_URL)

export const useBets = () => {
  const { walletAddress, isConnected } = useWallet()
  const queryClient = useQueryClient()

  const { data: bets, isLoading, refetch, error, isRefetching } = useQuery({
    queryKey: ['bets', walletAddress],
    queryFn: () => apiClient.getBets(walletAddress!),
    enabled: isConnected && !!walletAddress,
    staleTime: 30000,
  })

  const invalidateBets = () => {
    queryClient.invalidateQueries({ queryKey: ['bets', walletAddress] })
  }

  return {
    bets: bets ?? [],
    isLoading,
    isRefetching,
    refetch,
    error,
    invalidateBets,
  }
}
