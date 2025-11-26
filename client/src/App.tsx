import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { queryClient, setGlobalPrivyUserId } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider';
import NotFound from '@/pages/not-found';
import Splash from '@/pages/Splash';
import CreateProfile from '@/pages/CreateProfile';
import LinkWallet from '@/pages/LinkWallet';
import Home from '@/pages/Home';
import Leaderboard from '@/pages/Leaderboard';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import AllResults from '@/pages/AllResults';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TopBar from '@/components/TopBar';
import TabBar from '@/components/TabBar';
import Footer from '@/components/Footer';

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
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [ready]);

  // Redirect authenticated users from splash
  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;
    
    if (location === '/splash' && !checkingProfile) {
      setCheckingProfile(true);
      
      // Check if user actually has a profile in the database
      fetch('/api/user/me', {
        headers: {
          'x-privy-user-id': user.id,
        },
      })
        .then(async (response) => {
          if (response.ok) {
            const userData = await response.json();
            // Check if user has a linked wallet
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
  
  // Redirect users without wallet to link-wallet page (except when on link-wallet)
  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;
    
    const protectedRoutes = ['/', '/leaderboard', '/history', '/profile'];
    const needsWalletCheck = protectedRoutes.includes(location);
    
    if (needsWalletCheck) {
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
            }
          }
        })
        .catch((err) => {
          console.error('Wallet check failed:', err);
        });
    }
  }, [ready, authenticated, location, setLocation, user]);

  // Redirect unauthenticated users to splash
  useEffect(() => {
    if (!ready) return;
    
    const validRoutes = ['/', '/splash', '/create-profile', '/link-wallet', '/leaderboard', '/history', '/profile', '/admin', '/all-results', '/terms', '/privacy'];
    const publicRoutes = ['/splash', '/terms', '/privacy'];
    const isValidRoute = validRoutes.includes(location);
    const isPublicRoute = publicRoutes.includes(location);
    
    // Don't redirect if route doesn't exist - let 404 page show
    if (!isValidRoute) {
      return;
    }
    
    if (!authenticated && !isPublicRoute) {
      setLocation('/splash');
    }
  }, [ready, authenticated, location, setLocation]);

  // Hide nav on splash, profile creation, wallet linking, admin, and legal pages
  const hideNav = location === '/splash' || location === '/create-profile' || location === '/link-wallet' || location === '/admin' || location === '/terms' || location === '/privacy';

  // Show loading while Privy initializes
  if (!ready && !initTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error if Privy fails to initialize
  if (!ready && initTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 border-4 border-destructive rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Connection Issue</h2>
          <p className="text-sm text-muted-foreground">
            Unable to initialize authentication. This could be due to:
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• Network connectivity issues</li>
            <li>• Browser extensions blocking authentication</li>
            <li>• Ad blockers or privacy tools</li>
          </ul>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-primary to-brand-magenta text-white rounded-lg hover:opacity-90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && (
        <TopBar alphaPoints={1020} />
      )}
      
      <div className="flex flex-col min-h-screen">
        <Switch>
          <Route path="/splash" component={Splash} />
          <Route path="/create-profile" component={CreateProfile} />
          <Route path="/link-wallet" component={LinkWallet} />
          <Route path="/" component={Home} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/history" component={History} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/all-results" component={AllResults} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route component={NotFound} />
        </Switch>
        
        {!hideNav && <TabBar />}
        {!hideNav && <Footer />}
      </div>
    </div>
  );
}

function App() {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-2">Configuration Error</h1>
          <p className="text-muted-foreground">
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
          accentColor: '#2BFBD2',
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
