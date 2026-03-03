import { useLogin } from '@privy-io/react-auth';
import { Link } from 'wouter';
import { SiX, SiTelegram } from 'react-icons/si';
import { Download } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

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
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: Colors.dark.accent }}
            >
              <span className="text-3xl font-black" style={{ color: '#000' }}>P</span>
            </div>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: Colors.dark.text }}
          >
            Pally Feud
          </h1>
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: Colors.dark.accent }}
          >
            Think like the crowd. Win the prize.
          </p>
          <p
            className="text-sm"
            style={{ color: Colors.dark.textMuted }}
          >
            Daily consensus game. Pick what most people pick to win.
          </p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={() => login({ loginMethods: ['twitter'] })}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl transition-all',
              'active:scale-[0.98] hover:opacity-90'
            )}
            style={{ backgroundColor: Colors.dark.text, color: Colors.dark.background }}
            data-testid="button-continue-x"
          >
            <SiX size={20} />
            <span className="text-base font-bold">Continue with X</span>
          </button>

          <p
            className="text-xs"
            style={{ color: Colors.dark.textMuted }}
          >
            We use X to verify you're a real person and prevent bots.
          </p>
        </div>

        {/* Links */}
        <div className="pt-6 space-x-4" style={{ color: Colors.dark.textMuted }}>
          <Link href="/terms">
            <span className="text-xs hover:opacity-80 cursor-pointer" data-testid="link-terms">
              Terms of Service
            </span>
          </Link>
          <span className="text-xs">•</span>
          <Link href="/privacy">
            <span className="text-xs hover:opacity-80 cursor-pointer" data-testid="link-privacy">
              Privacy Policy
            </span>
          </Link>
        </div>

        {/* Additional Options */}
        <div className="pt-4 flex justify-center gap-6">
          <a
            href="https://t.me/PallyPredict_Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: Colors.dark.textMuted }}
            data-testid="link-telegram"
          >
            <SiTelegram size={18} />
            <span>Play on Telegram</span>
          </a>
          <button
            onClick={() => {
              alert('To install the app, tap the share button in your browser and select "Add to Home Screen"');
            }}
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: Colors.dark.textMuted }}
            data-testid="link-pwa"
          >
            <Download size={18} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
