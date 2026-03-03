import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import Colors from '@/constants/colors';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS prompt after delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  if (!showPrompt) return null;

  // iOS Instructions overlay
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ backgroundColor: Colors.dark.surface }}
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: Colors.dark.accentDim }}
            >
              <Smartphone size={24} color={Colors.dark.accent} />
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} color={Colors.dark.textMuted} />
            </button>
          </div>

          <h3
            className="text-lg font-bold mb-2"
            style={{ color: Colors.dark.text }}
          >
            Add to Home Screen
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
              >
                1
              </div>
              <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                Tap the <span className="font-semibold" style={{ color: Colors.dark.text }}>Share</span> button at the bottom of Safari
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
              >
                2
              </div>
              <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                Scroll down and tap <span className="font-semibold" style={{ color: Colors.dark.text }}>"Add to Home Screen"</span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
              >
                3
              </div>
              <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                Tap <span className="font-semibold" style={{ color: Colors.dark.text }}>"Add"</span> in the top right
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: Colors.dark.border, color: Colors.dark.text }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Standard install prompt banner
  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl p-4 shadow-xl"
      style={{
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: Colors.dark.accentDim }}
        >
          <Download size={20} color={Colors.dark.accent} />
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-bold mb-1"
            style={{ color: Colors.dark.text }}
          >
            Install Pally Feud
          </h4>
          <p
            className="text-xs"
            style={{ color: Colors.dark.textMuted }}
          >
            Add to home screen for the best experience
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X size={18} color={Colors.dark.textMuted} />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: Colors.dark.border, color: Colors.dark.textSecondary }}
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: Colors.dark.accent }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
