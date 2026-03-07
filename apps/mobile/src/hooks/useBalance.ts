import { useQuery } from '@tanstack/react-query'
import { rpcService } from '../services/rpcService'
import { useWallet } from './useWallet'

export const useBalance = () => {
  const { walletAddress, isConnected } = useWallet()

  const { data: balance, isLoading, refetch, error } = useQuery({
    queryKey: ['balance', walletAddress],
    queryFn: () => rpcService.getBalance(walletAddress!),
    enabled: isConnected && !!walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })

  return {
    balance: balance ?? 0,
    isLoading,
    refetch,
    error,
  }
}
