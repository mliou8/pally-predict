import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { RPC_ENDPOINT } from '../constants'

// NOTE: Connection is the Solana RPC client
const connection = new Connection(RPC_ENDPOINT, 'confirmed')

export const rpcService = {
  // Get the SOL balance for a wallet address
  getBalance: async (walletAddress: string): Promise<number> => {
    try {
      // NOTE: getBalance returns lamports, we convert to SOL
      const publicKey = new PublicKey(walletAddress)
      const lamports = await connection.getBalance(publicKey)
      return lamports / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      return 0
    }
  },

  // Get the latest blockhash for transaction building
  getLatestBlockhash: async () => {
    // NOTE: getLatestBlockhash is required for every Solana transaction
    return connection.getLatestBlockhash()
  },

  // Check if a transaction has been confirmed
  confirmTransaction: async (signature: string): Promise<boolean> => {
    try {
      const result = await connection.confirmTransaction(signature, 'confirmed')
      return !result.value.err
    } catch {
      return false
    }
  },
}
