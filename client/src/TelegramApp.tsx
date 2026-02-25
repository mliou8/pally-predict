import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TelegramProvider, useTelegram } from '@/contexts/TelegramContext';
import Colors from '@/constants/colors';
import TelegramPlay from '@/pages/TelegramPlay';
import TelegramResults from '@/pages/TelegramResults';
import TelegramLeaderboard from '@/pages/TelegramLeaderboard';
import TelegramProfile from '@/pages/TelegramProfile';
import TabBar from '@/components/TabBar';

function TelegramAppContent() {
  const [location] = useLocation();
  const { isInTelegram, isReady, user } = useTelegram();

  // Routes that should have the bottom tab bar
  const showTabBar = ['/', '/leaderboard', '/profile'].includes(location);

  // Show loading while Telegram initializes
  if (!isReady) {
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
          <p style={{ color: Colors.dark.textMuted }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not in Telegram - show error
  if (!isInTelegram) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-semibold" style={{ color: Colors.dark.text }}>
            Open in Telegram
          </h2>
          <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
            This app is designed to run inside Telegram. Please open it from the Telegram bot.
          </p>
          <a
            href="https://t.me/PallyPredict_Bot"
            className="inline-block px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
          >
            Open Telegram Bot
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <Switch>
        <Route path="/" component={TelegramPlay} />
        <Route path="/results" component={TelegramResults} />
        <Route path="/leaderboard" component={TelegramLeaderboard} />
        <Route path="/profile" component={TelegramProfile} />
      </Switch>

      {showTabBar && <TabBar />}
    </div>
  );
}

function TelegramApp() {
  return (
    <TelegramProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TelegramAppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </TelegramProvider>
  );
}

export default TelegramApp;
