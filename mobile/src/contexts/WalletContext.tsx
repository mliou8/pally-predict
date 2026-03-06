import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction, Connection, clusterApiUrl } from '@solana/web3.js';

interface WalletContextType {
  publicKey: PublicKey | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction | null>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_IDENTITY = {
  name: 'Pally Predict',
  uri: 'https://pallypredict.com',
  icon: 'favicon.ico',
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);

      await transact(async (wallet: Web3MobileWallet) => {
        const authorizationResult = await wallet.authorize({
          identity: APP_IDENTITY,
          cluster: 'mainnet-beta',
        });

        const pubkey = new PublicKey(authorizationResult.accounts[0].address);
        setPublicKey(pubkey);
        setAuthToken(authorizationResult.auth_token);
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setAuthToken(null);
  }, []);

  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction | null> => {
    if (!publicKey || !authToken) {
      console.error('Wallet not connected');
      return null;
    }

    try {
      let signedTransaction: Transaction | null = null;

      await transact(async (wallet: Web3MobileWallet) => {
        await wallet.reauthorize({
          auth_token: authToken,
          identity: APP_IDENTITY,
        });

        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = publicKey;

        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });

        signedTransaction = signedTransactions[0];
      });

      return signedTransaction;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      return null;
    }
  }, [publicKey, authToken]);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array | null> => {
    if (!publicKey || !authToken) {
      console.error('Wallet not connected');
      return null;
    }

    try {
      let signature: Uint8Array | null = null;

      await transact(async (wallet: Web3MobileWallet) => {
        await wallet.reauthorize({
          auth_token: authToken,
          identity: APP_IDENTITY,
        });

        const signedMessages = await wallet.signMessages({
          addresses: [publicKey.toBase58()],
          payloads: [message],
        });

        signature = signedMessages[0];
      });

      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      return null;
    }
  }, [publicKey, authToken]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnecting,
        isConnected: !!publicKey,
        connect,
        disconnect,
        signTransaction,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
