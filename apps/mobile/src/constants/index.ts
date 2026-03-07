import { PublicKey } from '@solana/web3.js'

export const APP_IDENTITY = {
  name: 'PredictSol',
  uri: 'https://predictsol.app',
  icon: 'favicon.ico',
}

// Switch to 'mainnet-beta' and the mainnet RPC when going to production
export const CLUSTER = 'devnet'
export const RPC_ENDPOINT = 'https://api.devnet.solana.com'

// Production backend server
export const API_BASE_URL = 'https://pally-predict-production.up.railway.app'

export const MIN_BET_LAMPORTS = 10_000_000 // 0.01 SOL

// Solana's Memo program — used to attach bet metadata to transactions on-chain
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
