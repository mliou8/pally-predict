import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Use devnet for testing
const CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER as any),
  'confirmed'
);

let treasuryKeypair: Keypair | null = null;

/**
 * Initialize treasury wallet from keypair file or environment variable
 */
export function initializeTreasury(): boolean {
  // Try environment variable first (base64 encoded keypair)
  if (process.env.TREASURY_KEYPAIR) {
    try {
      const secretKey = Buffer.from(process.env.TREASURY_KEYPAIR, 'base64');
      treasuryKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
      console.log(`Treasury initialized from env: ${treasuryKeypair.publicKey.toBase58()}`);
      return true;
    } catch (error) {
      console.error('Failed to load treasury from TREASURY_KEYPAIR env:', error);
    }
  }

  // Try keypair file
  const keypairPath = process.env.TREASURY_KEYPAIR_PATH;
  if (keypairPath && fs.existsSync(keypairPath)) {
    try {
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      treasuryKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      console.log(`Treasury initialized from file: ${treasuryKeypair.publicKey.toBase58()}`);
      return true;
    } catch (error) {
      console.error('Failed to load treasury keypair file:', error);
    }
  }

  console.warn('Treasury wallet not configured - SOL payouts disabled');
  return false;
}

/**
 * Check if treasury is configured and can send payouts
 */
export function isTreasuryConfigured(): boolean {
  return treasuryKeypair !== null;
}

/**
 * Get treasury public key
 */
export function getTreasuryPublicKey(): string | null {
  return treasuryKeypair?.publicKey.toBase58() || null;
}

/**
 * Get treasury SOL balance
 */
export async function getTreasuryBalance(): Promise<number> {
  if (!treasuryKeypair) {
    return 0;
  }
  const balance = await connection.getBalance(treasuryKeypair.publicKey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Send SOL payout to a winner
 * @param recipientAddress - Solana wallet address of the winner
 * @param amountLamports - Amount to send in lamports
 * @returns Transaction signature or null if failed
 */
export async function sendSolPayout(
  recipientAddress: string,
  amountLamports: bigint
): Promise<string | null> {
  if (!treasuryKeypair) {
    console.error('Treasury not configured - cannot send payout');
    return null;
  }

  if (amountLamports <= BigInt(0)) {
    console.error('Invalid payout amount:', amountLamports);
    return null;
  }

  try {
    const recipientPubkey = new PublicKey(recipientAddress);

    // Check treasury balance
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    if (BigInt(treasuryBalance) < amountLamports) {
      console.error(`Insufficient treasury balance: ${treasuryBalance} < ${amountLamports}`);
      return null;
    }

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: Number(amountLamports),
      })
    );

    // Send and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`SOL payout sent: ${Number(amountLamports) / LAMPORTS_PER_SOL} SOL to ${recipientAddress}, tx: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Failed to send SOL payout:', error);
    return null;
  }
}

/**
 * Verify a wager transaction was received by treasury
 * @param txSignature - Transaction signature to verify
 * @param expectedAmount - Expected amount in lamports
 * @returns true if valid wager transaction
 */
export async function verifyWagerTransaction(
  txSignature: string,
  expectedAmount?: bigint
): Promise<{ valid: boolean; amount: bigint; sender: string | null }> {
  if (!treasuryKeypair) {
    return { valid: false, amount: BigInt(0), sender: null };
  }

  try {
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { valid: false, amount: BigInt(0), sender: null };
    }

    // Check if transaction was successful
    if (tx.meta.err) {
      return { valid: false, amount: BigInt(0), sender: null };
    }

    // Find transfer to treasury
    const treasuryIndex = tx.transaction.message.staticAccountKeys.findIndex(
      (key) => key.equals(treasuryKeypair!.publicKey)
    );

    if (treasuryIndex === -1) {
      return { valid: false, amount: BigInt(0), sender: null };
    }

    // Calculate amount received by treasury
    const preBalance = tx.meta.preBalances[treasuryIndex];
    const postBalance = tx.meta.postBalances[treasuryIndex];
    const amountReceived = BigInt(postBalance - preBalance);

    // Get sender (first account is usually the fee payer/sender)
    const sender = tx.transaction.message.staticAccountKeys[0]?.toBase58() || null;

    // Verify amount if expected
    if (expectedAmount && amountReceived !== expectedAmount) {
      return { valid: false, amount: amountReceived, sender };
    }

    return { valid: true, amount: amountReceived, sender };
  } catch (error) {
    console.error('Failed to verify wager transaction:', error);
    return { valid: false, amount: BigInt(0), sender: null };
  }
}

// Initialize on module load
initializeTreasury();
