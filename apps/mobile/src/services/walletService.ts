// ALL Mobile Wallet Adapter interactions live in this file.
// Never call `transact()` from a screen, component, or hook directly.

import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { APP_IDENTITY, CLUSTER } from '../constants'

const AUTH_TOKEN_KEY = 'mwa_auth_token'
const WALLET_ADDRESS_KEY = 'mwa_wallet_address'

// NOTE: The auth_token is like a session cookie. Once a user approves
// your app in their wallet, you get a token back. Store it and pass it on
// future calls so the user doesn't have to re-approve every time.

export const walletService = {

  // NOTE: Connect opens the installed wallet app (Phantom, Solflare, Seed Vault, etc.)
  // and requests authorization. Returns the wallet's base58 public key.
  connect: async (): Promise<string> => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY)

    // NOTE: transact() opens the MWA session with the wallet app
    return transact(async (wallet: Web3MobileWallet) => {
      const authResult = await wallet.authorize({
        cluster: CLUSTER as any,
        identity: APP_IDENTITY,
        // Passing the stored token silently reconnects if the session is still valid
        ...(storedToken ? { auth_token: storedToken } : {}),
      })

      const address = authResult.accounts[0].address
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authResult.auth_token)
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, address)
      return address
    })
  },

  // NOTE: Disconnect invalidates the auth token in the wallet and clears local storage
  disconnect: async (): Promise<void> => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) return

    // NOTE: transact() opens the MWA session with the wallet app
    await transact(async (wallet: Web3MobileWallet) => {
      await wallet.deauthorize({ auth_token: storedToken })
    })

    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY)
  },

  // Restore session on app launch without prompting the user again
  restoreSession: async (): Promise<string | null> => {
    return AsyncStorage.getItem(WALLET_ADDRESS_KEY)
  },

  // NOTE: Sign and send a pre-built transaction. Returns the tx signature on success.
  signAndSendTransaction: async (transactionBytes: Uint8Array): Promise<string> => {
    // NOTE: transact() opens the MWA session with the wallet app
    return transact(async (wallet: Web3MobileWallet) => {
      // NOTE: signAndSendTransactions is the MWA method to sign and broadcast
      const [signedTx] = await wallet.signAndSendTransactions({
        transactions: [transactionBytes as any],
      })
      return Buffer.from(signedTx).toString('base64')
    })
  },

  // NOTE: Check if the wallet's URI identifies it as the Seeker's Seed Vault Wallet
  checkIsSeekerWallet: async (): Promise<boolean> => {
    try {
      // NOTE: transact() opens the MWA session with the wallet app
      return transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          cluster: CLUSTER as any,
          identity: APP_IDENTITY,
        })
        const uri = (authResult as any).wallet_uri_base ?? ''
        return uri.toLowerCase().includes('seedvault') ||
               uri.toLowerCase().includes('solanamobile')
      })
    } catch {
      return false
    }
  },
}
