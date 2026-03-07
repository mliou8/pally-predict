import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { RPC_ENDPOINT, MEMO_PROGRAM_ID } from '../constants'

// NOTE: Connection is the Solana RPC client
const connection = new Connection(RPC_ENDPOINT, 'confirmed')

export const transactionService = {

  // Fetch the latest blockhash — required to build any transaction
  getLatestBlockhash: async () => {
    // NOTE: getLatestBlockhash is required for every Solana transaction
    return connection.getLatestBlockhash()
  },

  // Build a bet transaction:
  // - Transfers SOL from bettor to the market's on-chain account
  // - Attaches a Memo instruction so the backend indexer can identify the bet
  buildBetTransaction: async (
    fromWallet: string,
    marketOnChainAddress: string,
    amountLamports: number,
    marketId: string,
    option: string
  ): Promise<Uint8Array> => {
    const { blockhash } = await transactionService.getLatestBlockhash()
    // NOTE: PublicKey is Solana's address type
    const fromKey = new PublicKey(fromWallet)
    const toKey = new PublicKey(marketOnChainAddress)

    // NOTE: The Memo instruction writes JSON metadata into the transaction.
    // Your backend can read this from the chain to record bets without a separate API call.
    const memo = JSON.stringify({ marketId, option, bettor: fromWallet })

    // NOTE: Transaction is the Solana transaction builder
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromKey })
      .add(SystemProgram.transfer({ fromPubkey: fromKey, toPubkey: toKey, lamports: amountLamports }))
      .add(new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo),
      }))

    return tx.serialize({ requireAllSignatures: false })
  },

  // Build a create-market transaction:
  // - Writes market metadata into a Memo instruction on-chain
  // - Your backend + Anchor program handles the actual PDA account creation
  buildCreateMarketTransaction: async (
    creatorWallet: string,
    marketId: string,
    title: string,
    options: string[],
    resolvesAt: number
  ): Promise<Uint8Array> => {
    const { blockhash } = await transactionService.getLatestBlockhash()
    // NOTE: PublicKey is Solana's address type
    const creatorKey = new PublicKey(creatorWallet)

    const memo = JSON.stringify({
      action: 'create_market',
      marketId,
      title,
      options,
      resolvesAt,
      creator: creatorWallet,
    })

    // NOTE: Transaction is the Solana transaction builder
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: creatorKey })
      .add(new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo),
      }))

    return tx.serialize({ requireAllSignatures: false })
  },
}
