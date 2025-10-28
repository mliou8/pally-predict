import { useState } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Splash from '@/pages/Splash';
import Home from '@/pages/Home';
import Leaderboard from '@/pages/Leaderboard';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import TopBar from '@/components/TopBar';
import TabBar from '@/components/TabBar';
import NotificationsDrawer from '@/components/NotificationsDrawer';

function Router() {
  return (
    <Switch>
      <Route path="/splash" component={Splash} />
      <Route path="/" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/history" component={History} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  //todo: remove mock functionality
  const nextDrop = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <TopBar 
            alphaPoints={1020} 
            nextDropTime={nextDrop}
            onNotificationsClick={() => setNotificationsOpen(true)}
          />
          <Router />
          <TabBar />
          <NotificationsDrawer 
            open={notificationsOpen} 
            onOpenChange={setNotificationsOpen}
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
