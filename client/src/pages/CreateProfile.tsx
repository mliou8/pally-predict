import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

export default function CreateProfile() {
  const [, setLocation] = useLocation();
  const [handle, setHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim()) {
      console.log('Creating profile:', { handle, avatarUrl });
      setLocation('/');
    }
  };

  const isValid = handle.trim().length >= 3;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-8">
          <BrandMark size="md" animated={false} />
          <h1 className="mt-6 text-2xl font-display font-bold text-foreground">
            Create Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your handle and start earning Alpha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {handle.substring(0, 2).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter avatar URL (optional):');
                  if (url) setAvatarUrl(url);
                }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover-elevate active-elevate-2"
                data-testid="button-upload-avatar"
              >
                <Camera size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="handle"
                type="text"
                placeholder="cryptooracle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="pl-8"
                maxLength={20}
                data-testid="input-handle"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!isValid}
            data-testid="button-create-profile"
          >
            Start Trading
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By creating a profile, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
