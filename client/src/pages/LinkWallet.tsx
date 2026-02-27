import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallet } from '@/components/SolanaWalletProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BrandMark from '@/components/BrandMark';
import { apiRequest } from '@/lib/api';

export default function LinkWallet() {
  const [, setLocation] = useLocation();
  const { user } = usePrivy();
  const { connected, connecting, publicKey, connect, signMessage, phantomInstalled } = useSolanaWallet();
  const { toast } = useToast();
  
  const [isLinking, setIsLinking] = useState(false);
  const [linkStatus, setLinkStatus] = useState<'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    
    const checkWalletStatus = async () => {
      try {
        const response = await apiRequest('/api/solana/status', {
          method: 'GET',
        }, user.id);
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasWallet) {
            setLocation('/');
          }
        }
      } catch (error) {
        console.error('Failed to check wallet status:', error);
      }
    };
    
    checkWalletStatus();
  }, [user?.id, setLocation]);

  const handleLinkWallet = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        variant: 'destructive',
      });
      return;
    }

    if (!phantomInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsLinking(true);
    setErrorMessage('');

    try {
      if (!connected) {
        setLinkStatus('connecting');
        await connect();
      }

      // Wait for publicKey to be available with retry logic
      let attempts = 0;
      const maxAttempts = 10;
      while (!publicKey && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!publicKey) {
        throw new Error('Wallet connected but public key not available. Please try again.');
      }

      const walletAddress = publicKey.toBase58();

      setLinkStatus('signing');
      // Request nonce with wallet address bound (security: prevents replay attacks)
      const nonceResponse = await fetch(`/api/solana/nonce?address=${encodeURIComponent(walletAddress)}`, {
        headers: {
          'x-privy-user-id': user.id,
        },
      });

      if (!nonceResponse.ok) {
        const error = await nonceResponse.json();
        throw new Error(error.error || 'Failed to get signing nonce');
      }

      const { message } = await nonceResponse.json();

      // Sign the secure message that includes user ID, address, nonce, and timestamp
      const signature = await signMessage(message);
      if (!signature) {
        throw new Error('Failed to sign message. Please try again.');
      }

      setLinkStatus('verifying');
      const linkResponse = await apiRequest('/api/solana/link', {
        method: 'POST',
        body: JSON.stringify({
          address: walletAddress,
          signature,
          message,
        }),
      }, user.id);

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        throw new Error(error.error || 'Failed to link wallet');
      }

      setLinkStatus('success');
      toast({
        title: 'Success',
        description: 'Wallet linked successfully!',
      });

      setTimeout(() => {
        setLocation('/');
      }, 1500);

    } catch (error: any) {
      setLinkStatus('error');
      setErrorMessage(error.message || 'Failed to link wallet');
      toast({
        title: 'Error',
        description: error.message || 'Failed to link wallet',
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const getStatusMessage = () => {
    switch (linkStatus) {
      case 'connecting':
        return 'Connecting to Phantom...';
      case 'signing':
        return 'Please sign the message in Phantom...';
      case 'verifying':
        return 'Verifying signature...';
      case 'success':
        return 'Wallet linked successfully!';
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-8">
          <BrandMark size="md" animated={false} />
          <h1 className="mt-6 text-2xl font-display font-bold text-foreground">
            Link Your Wallet
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your Phantom wallet to place bets and receive payouts
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#AB9FF2] to-[#7C3AED] flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Phantom Wallet Required</CardTitle>
            <CardDescription>
              To participate in predictions and win SOL, you need to link a Phantom wallet. Your winnings will be sent directly to this wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkStatus !== 'idle' && linkStatus !== 'success' && linkStatus !== 'error' && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">{getStatusMessage()}</span>
              </div>
            )}

            {linkStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 py-4 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{getStatusMessage()}</span>
              </div>
            )}

            {linkStatus === 'error' && (
              <div className="flex items-center justify-center gap-2 py-4 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{getStatusMessage()}</span>
              </div>
            )}

            {connected && publicKey && linkStatus === 'idle' && (
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                <p className="text-sm font-mono truncate">{publicKey.toBase58()}</p>
              </div>
            )}

            <Button
              onClick={handleLinkWallet}
              className="w-full bg-gradient-to-r from-[#AB9FF2] to-[#7C3AED] hover:opacity-90"
              size="lg"
              disabled={isLinking || linkStatus === 'success'}
              data-testid="button-link-wallet"
            >
              {!phantomInstalled ? (
                <>
                  Install Phantom Wallet
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              ) : connecting || isLinking ? (
                'Linking...'
              ) : connected ? (
                'Sign & Link Wallet'
              ) : (
                'Connect Phantom Wallet'
              )}
            </Button>

            {!phantomInstalled && (
              <p className="text-xs text-center text-muted-foreground">
                Phantom is the most popular Solana wallet.{' '}
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get it here
                </a>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Secure & Private</p>
              <p className="text-muted-foreground">We only verify wallet ownership. We never access your funds.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Direct Payouts</p>
              <p className="text-muted-foreground">Winnings are sent directly to your wallet when results are revealed.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Devnet for Testing</p>
              <p className="text-muted-foreground">Currently using Solana Devnet. No real funds required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
