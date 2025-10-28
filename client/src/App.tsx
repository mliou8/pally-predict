import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Splash from '@/pages/Splash';
import CreateProfile from '@/pages/CreateProfile';
import Home from '@/pages/Home';
import Leaderboard from '@/pages/Leaderboard';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import TopBar from '@/components/TopBar';
import TabBar from '@/components/TabBar';

function AppContent() {
  const [location, setLocation] = useLocation();
  const { ready, authenticated } = usePrivy();

  // Redirect logic based on authentication
  useEffect(() => {
    if (!ready) return;
    
    if (!authenticated) {
      if (location !== '/splash') {
        setLocation('/splash');
      }
    } else {
      if (location === '/splash') {
        const hasProfile = localStorage.getItem('pallyUserHandle');
        setLocation(hasProfile ? '/' : '/create-profile');
      }
    }
  }, [ready, authenticated, location, setLocation]);

  // Hide nav on splash, profile creation, and admin pages
  const hideNav = location === '/splash' || location === '/create-profile' || location === '/admin';

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && (
        <TopBar alphaPoints={1020} />
      )}
      
      <Switch>
        <Route path="/splash" component={Splash} />
        <Route path="/create-profile" component={CreateProfile} />
        <Route path="/" component={Home} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      
      {!hideNav && <TabBar />}
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;
