import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: <T>(transaction: T) => Promise<T>;
  signAllTransactions: <T>(transactions: T[]) => Promise<T[]>;
  on: (event: string, callback: (args: any) => void) => void;
  off: (event: string, callback: (args: any) => void) => void;
}

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  connection: Connection;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  phantomInstalled: boolean;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | null>(null);

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
}

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [phantomInstalled, setPhantomInstalled] = useState(false);
  
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  const getPhantom = useCallback((): PhantomProvider | null => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        return provider as PhantomProvider;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const phantom = getPhantom();
    setPhantomInstalled(!!phantom);

    if (phantom) {
      if (phantom.publicKey) {
        setPublicKey(phantom.publicKey);
        setConnected(true);
      }

      const handleConnect = (pubKey: PublicKey) => {
        setPublicKey(pubKey);
        setConnected(true);
      };

      const handleDisconnect = () => {
        setPublicKey(null);
        setConnected(false);
      };

      phantom.on('connect', handleConnect);
      phantom.on('disconnect', handleDisconnect);

      return () => {
        phantom.off('connect', handleConnect);
        phantom.off('disconnect', handleDisconnect);
      };
    }
  }, [getPhantom]);

  const connect = useCallback(async () => {
    const phantom = getPhantom();
    if (!phantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const response = await phantom.connect();
      setPublicKey(response.publicKey);
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect to Phantom:', error);
    } finally {
      setConnecting(false);
    }
  }, [getPhantom]);

  const disconnect = useCallback(async () => {
    const phantom = getPhantom();
    if (phantom) {
      await phantom.disconnect();
      setPublicKey(null);
      setConnected(false);
    }
  }, [getPhantom]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    const phantom = getPhantom();
    if (!phantom || !connected) {
      return null;
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const { signature } = await phantom.signMessage(encodedMessage);
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }, [getPhantom, connected]);

  const value: SolanaWalletContextType = {
    connected,
    connecting,
    publicKey,
    connection,
    connect,
    disconnect,
    signMessage,
    phantomInstalled,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export default SolanaWalletProvider;
