import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function LinkTelegram() {
  const [, setLocation] = useLocation();
  const { ready, authenticated, user } = usePrivy();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect to splash if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      setLocation('/splash');
    }
  }, [ready, authenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid 6-character code',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Not Authenticated',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/link/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-privy-user-id': user.id,
        },
        body: JSON.stringify({ token: code.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link account');
      }

      setSuccess(true);
      toast({
        title: 'Account Linked!',
        description: 'Your Telegram account is now connected.',
      });

      // Redirect after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Link Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (!ready) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-4 bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account Linked!</h1>
          <p className="text-muted-foreground">
            Your Telegram account is now connected to your web account.
            Your balance and stats have been merged.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Link Telegram Account</h1>
          <p className="text-muted-foreground mt-2">
            Enter the 6-character code from the Telegram bot to link your accounts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Link Code
            </label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-character code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono uppercase"
              maxLength={6}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Get this code by sending /link to the Pally Feud Telegram bot
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-brand-magenta hover:opacity-90"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Linking...
              </span>
            ) : (
              'Link Account'
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">How it works:</h3>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              Open Telegram and find @PallyPredictBot
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              Send the /link command
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              Copy the 6-character code
            </li>
            <li className="flex gap-2">
              <span className="text-primary">4.</span>
              Enter the code above to link your accounts
            </li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">
            After linking, your Telegram balance and stats will be merged with your web account.
          </p>
        </div>
      </div>
    </div>
  );
}
