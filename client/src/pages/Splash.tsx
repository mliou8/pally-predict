import { useLogin } from '@privy-io/react-auth';
import { Link } from 'wouter';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { SiX } from 'react-icons/si';

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
          <p className="mt-4 text-lg font-semibold text-foreground">
            Predict outcomes. Win up to 10x.
          </p>
          <p className="text-sm text-muted-foreground">
            Daily prediction game with real rewards. Top predictors earn SOL.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => login({ loginMethods: ['twitter'] })}
            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-opacity"
            size="lg"
            data-testid="button-continue-x"
          >
            <SiX size={18} className="mr-2" />
            Continue with X
          </Button>

          <p className="text-xs text-muted-foreground">
            We use X to verify you're a real person and prevent bots.
          </p>
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
