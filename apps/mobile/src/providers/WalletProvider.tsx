import React, { createContext, useContext, useEffect, useState } from 'react'
import { walletService } from '../services/walletService'

type WalletContextType = {
  walletAddress: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  error: string | null
}

const WalletContext = createContext<WalletContextType | null>(null)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // On app launch, silently restore a previous session
  useEffect(() => {
    walletService.restoreSession().then(setWalletAddress)
  }, [])

  const connect = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const address = await walletService.connect()
      setWalletAddress(address)
    } catch (e: any) {
      // NOTE: NoWalletFound means no MWA-compatible wallet is installed.
      // Guide the user to install one from the Solana dApp Store.
      if (e?.message?.includes('No wallet')) {
        setError('No wallet found. Please install Phantom or Solflare.')
      } else {
        setError(e?.message ?? 'Connection failed')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    await walletService.disconnect()
    setWalletAddress(null)
  }

  return (
    <WalletContext.Provider value={{
      walletAddress,
      isConnected: !!walletAddress,
      isConnecting,
      connect,
      disconnect,
      error,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
