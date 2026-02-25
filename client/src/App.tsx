import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { queryClient, setGlobalPrivyUserId } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider';
import Colors from '@/constants/colors';
import NotFound from '@/pages/not-found';
import Splash from '@/pages/Splash';
import CreateProfile from '@/pages/CreateProfile';
import LinkWallet from '@/pages/LinkWallet';
import Play from '@/pages/Play';
import Results from '@/pages/Results';
import Leaderboard from '@/pages/Leaderboard';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import TelegramAdmin from '@/pages/TelegramAdmin';
import AllResults from '@/pages/AllResults';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import LinkTelegram from '@/pages/LinkTelegram';
import TabBar from '@/components/TabBar';

function AppContent() {
  const [location, setLocation] = useLocation();
  const { ready, authenticated, user } = usePrivy();
  const [initTimeout, setInitTimeout] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Set global Privy user ID for API requests
  useEffect(() => {
    setGlobalPrivyUserId(user?.id || null);
  }, [user]);

  // Timeout for Privy initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        setInitTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [ready]);

  // Redirect authenticated users from splash
  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    if (location === '/splash' && !checkingProfile) {
      setCheckingProfile(true);

      fetch('/api/user/me', {
        headers: {
          'x-privy-user-id': user.id,
        },
      })
        .then(async (response) => {
          if (response.ok) {
            const userData = await response.json();
            if (!userData.solanaAddress) {
              setLocation('/link-wallet');
            } else {
              setLocation('/');
            }
          } else if (response.status === 404) {
            setLocation('/create-profile');
          }
        })
        .catch((err) => {
          console.error('Profile check failed:', err);
          setCheckingProfile(false);
        });
    }
  }, [ready, authenticated, location, setLocation, user, checkingProfile]);

  // Redirect unauthenticated users to splash (except for public routes)
  useEffect(() => {
    if (!ready) return;

    const validRoutes = ['/', '/splash', '/create-profile', '/link-wallet', '/link', '/leaderboard', '/history', '/profile', '/admin', '/telegram-admin', '/all-results', '/terms', '/privacy', '/results'];
    // Main game routes are now public
    const publicRoutes = ['/', '/results', '/splash', '/terms', '/privacy', '/leaderboard'];
    const isValidRoute = validRoutes.includes(location);
    const isPublicRoute = publicRoutes.includes(location);

    if (!isValidRoute) {
      return;
    }

    if (!authenticated && !isPublicRoute) {
      setLocation('/splash');
    }
  }, [ready, authenticated, location, setLocation]);

  // Routes that should have the bottom tab bar
  const showTabBar = ['/', '/leaderboard', '/history', '/profile'].includes(location);

  // Show loading while Privy initializes
  if (!ready && !initTimeout) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }}
          />
          <p style={{ color: Colors.dark.textMuted }}>Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error if Privy fails to initialize
  if (!ready && initTimeout) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div className="text-center space-y-4 max-w-md">
          <div
            className="w-12 h-12 border-4 rounded-full flex items-center justify-center mx-auto"
            style={{ borderColor: Colors.dark.error }}
          >
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold" style={{ color: Colors.dark.text }}>
            Connection Issue
          </h2>
          <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
            Unable to initialize authentication. This could be due to:
          </p>
          <ul className="text-sm text-left space-y-1" style={{ color: Colors.dark.textMuted }}>
            <li>• Network connectivity issues</li>
            <li>• Browser extensions blocking authentication</li>
            <li>• Ad blockers or privacy tools</li>
          </ul>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <Switch>
        <Route path="/splash" component={Splash} />
        <Route path="/create-profile" component={CreateProfile} />
        <Route path="/link-wallet" component={LinkWallet} />
        <Route path="/" component={Play} />
        <Route path="/results" component={Results} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
        <Route path="/telegram-admin" component={TelegramAdmin} />
        <Route path="/all-results" component={AllResults} />
        <Route path="/link" component={LinkTelegram} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route component={NotFound} />
      </Switch>

      {showTabBar && <TabBar />}
    </div>
  );
}

function App() {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2" style={{ color: Colors.dark.error }}>
            Configuration Error
          </h1>
          <p style={{ color: Colors.dark.textMuted }}>
            Missing VITE_PRIVY_APP_ID environment variable. Please configure your Privy App ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord'],
        appearance: {
          theme: 'dark',
          accentColor: '#FF6B35',
          logo: undefined,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <SolanaWalletProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </SolanaWalletProvider>
    </PrivyProvider>
  );
}

export default App;
