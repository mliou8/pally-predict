import { useLogin } from '@privy-io/react-auth';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Wallet, Mail } from 'lucide-react';
import { SiX, SiGoogle, SiDiscord } from 'react-icons/si';

export default function Splash() {
  const { login } = useLogin({
    onComplete: ({ user }) => {
      console.log('Login successful:', user.id);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mb-8">
          <BrandMark size="lg" animated />
          <p className="mt-4 text-lg text-muted-foreground">
            Predict the crowd. Earn Alpha. Rise the ranks.
          </p>
          <p className="text-sm text-muted-foreground">
            Daily prediction game where rare picks win big.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => login()}
            className="w-full bg-gradient-to-r from-primary to-brand-magenta hover:opacity-90 transition-opacity"
            size="lg"
            data-testid="button-connect-wallet"
          >
            <Wallet size={20} className="mr-2" />
            Connect Wallet
          </Button>

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
