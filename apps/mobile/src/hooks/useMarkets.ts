import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient, Market } from '@predictsol/shared'
import { API_BASE_URL } from '../constants'

const apiClient = createApiClient(API_BASE_URL)

export const useMarkets = (status: 'open' | 'resolved' | 'cancelled' = 'open') => {
  const queryClient = useQueryClient()

  const { data: markets, isLoading, refetch, error, isRefetching } = useQuery({
    queryKey: ['markets', status],
    queryFn: () => apiClient.getMarkets(status),
    staleTime: 30000,
  })

  const invalidateMarkets = () => {
    queryClient.invalidateQueries({ queryKey: ['markets'] })
  }

  return {
    markets: markets ?? [],
    isLoading,
    isRefetching,
    refetch,
    error,
    invalidateMarkets,
  }
}

export const useMarket = (marketId: string) => {
  const { data: market, isLoading, refetch, error } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => apiClient.getMarket(marketId),
    enabled: !!marketId,
    staleTime: 10000,
  })

  return {
    market,
    isLoading,
    refetch,
    error,
  }
}
