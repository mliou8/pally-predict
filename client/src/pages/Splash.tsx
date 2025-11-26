import { useLogin } from '@privy-io/react-auth';
import { useSolanaWallet } from '@/components/SolanaWalletProvider';
import { Link, useLocation } from 'wouter';
import { useEffect } from 'react';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Mail, Wallet } from 'lucide-react';
import { SiX, SiGoogle, SiDiscord } from 'react-icons/si';

export default function Splash() {
  const [, setLocation] = useLocation();
  const { connected, publicKey, connect, connecting, phantomInstalled } = useSolanaWallet();

  const { login } = useLogin({
    onComplete: ({ user }) => {
      console.log('Login successful:', user.id);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  useEffect(() => {
    if (connected && publicKey) {
      console.log('Phantom wallet connected:', publicKey.toString());
      setLocation('/create-profile');
    }
  }, [connected, publicKey, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mb-8">
          <BrandMark size="lg" animated />
          <p className="mt-4 text-lg font-semibold text-foreground">
            Crypto Family Feud. Prove you're the best on CT.
          </p>
          <p className="text-sm text-muted-foreground">
            Daily prediction game where the best are rewarded
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={connect}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-[#AB9FF2] to-[#7C3AED] hover:opacity-90 transition-opacity"
            size="lg"
            data-testid="button-connect-phantom"
          >
            <Wallet size={20} className="mr-2" />
            {connecting ? 'Connecting...' : phantomInstalled ? 'Connect Phantom Wallet' : 'Install Phantom Wallet'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => login({ loginMethods: ['twitter'] })}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-continue-x"
            >
              <SiX size={16} className="mr-2" />
              X
            </Button>

            <Button
              onClick={() => login({ loginMethods: ['google'] })}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-continue-google"
            >
              <SiGoogle size={16} className="mr-2" />
              Google
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => login({ loginMethods: ['discord'] })}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-continue-discord"
            >
              <SiDiscord size={18} className="mr-2" />
              Discord
            </Button>

            <Button
              onClick={() => login({ loginMethods: ['email'] })}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-continue-email"
            >
              <Mail size={18} className="mr-2" />
              Email
            </Button>
          </div>
        </div>

        <div className="pt-6 text-xs text-muted-foreground space-x-4">
          <Link 
            href="/terms" 
            className="hover:text-foreground transition-colors" 
            data-testid="link-terms"
          >
            Terms of Service
          </Link>
          <span>•</span>
          <Link 
            href="/privacy" 
            className="hover:text-foreground transition-colors" 
            data-testid="link-privacy"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
