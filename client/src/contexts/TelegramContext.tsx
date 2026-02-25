import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Telegram Web App types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: { type?: string; text?: string; id?: string }[] }) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramContextValue {
  isInTelegram: boolean;
  isReady: boolean;
  user: TelegramUser | null;
  initData: string;
  webApp: TelegramWebApp | null;
  haptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => void;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  setMainButtonLoading: (loading: boolean) => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
}

const TelegramContext = createContext<TelegramContextValue>({
  isInTelegram: false,
  isReady: false,
  user: null,
  initData: '',
  webApp: null,
  haptic: () => {},
  showMainButton: () => {},
  hideMainButton: () => {},
  setMainButtonLoading: () => {},
  showBackButton: () => {},
  hideBackButton: () => {},
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [mainButtonCallback, setMainButtonCallback] = useState<(() => void) | null>(null);
  const [backButtonCallback, setBackButtonCallback] = useState<(() => void) | null>(null);

  const isInTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;

  useEffect(() => {
    if (!isInTelegram) {
      setIsReady(true);
      return;
    }

    const tg = window.Telegram!.WebApp;
    setWebApp(tg);

    // Set user from init data
    if (tg.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user);
    }

    // Configure the web app
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0A0D15');
    tg.setBackgroundColor('#0A0D15');

    setIsReady(true);
  }, [isInTelegram]);

  // Haptic feedback
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (!webApp?.HapticFeedback) return;

    if (type === 'selection') {
      webApp.HapticFeedback.selectionChanged();
    } else if (['success', 'error', 'warning'].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning');
    } else {
      webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
    }
  }, [webApp]);

  // Main button management
  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (!webApp?.MainButton) return;

    // Remove old callback if exists
    if (mainButtonCallback) {
      webApp.MainButton.offClick(mainButtonCallback);
    }

    webApp.MainButton.setText(text);
    webApp.MainButton.color = '#FF6B35';
    webApp.MainButton.textColor = '#FFFFFF';
    webApp.MainButton.onClick(onClick);
    webApp.MainButton.show();
    webApp.MainButton.enable();

    setMainButtonCallback(() => onClick);
  }, [webApp, mainButtonCallback]);

  const hideMainButton = useCallback(() => {
    if (!webApp?.MainButton) return;

    if (mainButtonCallback) {
      webApp.MainButton.offClick(mainButtonCallback);
    }
    webApp.MainButton.hide();
    setMainButtonCallback(null);
  }, [webApp, mainButtonCallback]);

  const setMainButtonLoading = useCallback((loading: boolean) => {
    if (!webApp?.MainButton) return;

    if (loading) {
      webApp.MainButton.showProgress();
      webApp.MainButton.disable();
    } else {
      webApp.MainButton.hideProgress();
      webApp.MainButton.enable();
    }
  }, [webApp]);

  // Back button management
  const showBackButton = useCallback((onClick: () => void) => {
    if (!webApp?.BackButton) return;

    if (backButtonCallback) {
      webApp.BackButton.offClick(backButtonCallback);
    }

    webApp.BackButton.onClick(onClick);
    webApp.BackButton.show();

    setBackButtonCallback(() => onClick);
  }, [webApp, backButtonCallback]);

  const hideBackButton = useCallback(() => {
    if (!webApp?.BackButton) return;

    if (backButtonCallback) {
      webApp.BackButton.offClick(backButtonCallback);
    }
    webApp.BackButton.hide();
    setBackButtonCallback(null);
  }, [webApp, backButtonCallback]);

  return (
    <TelegramContext.Provider
      value={{
        isInTelegram,
        isReady,
        user,
        initData: webApp?.initData || '',
        webApp,
        haptic,
        showMainButton,
        hideMainButton,
        setMainButtonLoading,
        showBackButton,
        hideBackButton,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}

export default TelegramContext;
