import { useLocation } from 'wouter';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Wallet, Mail } from 'lucide-react';
import { SiX } from 'react-icons/si';

export default function Splash() {
  const [, setLocation] = useLocation();

  const handleLogin = (method: string) => {
    console.log('Login with:', method);
    // After authentication, redirect to profile creation
    setLocation('/create-profile');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mb-8">
          <BrandMark size="lg" animated />
          <p className="mt-4 text-lg text-muted-foreground">
            Fantasy sports for degens.
          </p>
          <p className="text-sm text-muted-foreground">
            Predict. Earn Alpha. Rise the Ranks.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleLogin('wallet')}
            className="w-full"
            size="lg"
            data-testid="button-connect-wallet"
          >
            <Wallet size={20} className="mr-2" />
            Connect Wallet
          </Button>

          <Button
            onClick={() => handleLogin('x')}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-continue-x"
          >
            <SiX size={16} className="mr-2" />
            Continue with X
          </Button>

          <Button
            onClick={() => handleLogin('email')}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-continue-email"
          >
            <Mail size={20} className="mr-2" />
            Continue with Email
          </Button>
        </div>

        <div className="pt-6 text-xs text-muted-foreground space-x-4">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
