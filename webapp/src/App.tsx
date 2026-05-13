import { useState, useEffect, useCallback } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { LoadingScreen, BottomNav } from './shared';
import { HomeView, WalletView, SupportView, ProfileView, TradeView } from './pages';
import { CryptoScreen, ScreenerScreen } from './pages/trade/components';
import { LoginScreen, NoPasswordScreen, useAuthSession } from './pages/auth';
import { useWebApp } from './hooks';
import { useAppStore } from './store';
import { useI18nStore } from './i18n/useTranslation';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const { user, webApp, isTelegram, isLoading: isTgLoading } = useWebApp();
  const { setUser, isFullscreen, setFullscreen, activeMarket, setActiveMarket } = useAppStore();
  const setLanguage = useI18nStore((s) => s.setLanguage);

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
      });
      if (!localStorage.getItem('app_language')) {
        const lang = user.language_code === 'ru' ? 'ru' : user.language_code === 'uk' ? 'ua' : 'en';
        setLanguage(lang as 'ru' | 'en' | 'ua');
      }
    }
  }, [user, setUser, setLanguage]);

  useEffect(() => {
    if (webApp) {
      if (webApp.isFullscreen !== undefined) {
        setFullscreen(!!webApp.isFullscreen);
      }
      const handleFullscreenChange = () => {
        if (webApp.isFullscreen !== undefined) {
          setFullscreen(!!webApp.isFullscreen);
        }
      };
      
      try {
        if (webApp.onEvent) {
          webApp.onEvent('fullscreen_changed', handleFullscreenChange);
          webApp.onEvent('fullscreen_failed', handleFullscreenChange);
        }
      } catch (e) {
        console.warn('fullscreen events not supported', e);
      }

      return () => {
        try {
          if (webApp.offEvent) {
            webApp.offEvent('fullscreen_changed', handleFullscreenChange);
            webApp.offEvent('fullscreen_failed', handleFullscreenChange);
          }
        } catch (e) {
          // ignore
        }
      };
    }
  }, [webApp, setFullscreen]);

  const handleCloseMarket = useCallback(() => setActiveMarket(null), [setActiveMarket]);

  // Auth: проверяем наличие пароля / валидной сессии WebApp.
  const { state: authState, refresh: refreshAuth, onLoginSuccess } = useAuthSession({
    enabled: isTelegram && !isTgLoading,
  });

  // Пока Telegram SDK инициализируется (до 2с) — показываем чёрный экран,
  // чтобы не мигать "Telegram Only" на нормальном запуске в TG.
  if (isTgLoading) {
    return <div className="bg-black min-h-screen" />;
  }

  if (!isTelegram) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-zinc-100 font-sans p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Telegram Only</h1>
          <p className="text-zinc-400 text-sm">
            This app is available only inside Telegram. Please open it via the bot.
          </p>
        </div>
      </div>
    );
  }

  // Auth gate — пока статус неизвестен или пользователь не авторизован,
  // главный UI не рендерим, чтобы избежать «мигания» приватного содержимого.
  if (authState.status === 'checking') {
    return <div className="bg-black min-h-screen" />;
  }
  if (authState.status === 'no_password') {
    return <NoPasswordScreen onRetry={refreshAuth} />;
  }
  if (authState.status === 'needs_login') {
    return <LoginScreen nickname={authState.nickname} onSuccess={onLoginSuccess} />;
  }
  if (authState.status === 'error') {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-zinc-100 font-sans p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-zinc-400 text-sm mb-4">{authState.message}</p>
          <button
            onClick={refreshAuth}
            className="h-11 px-5 rounded-xl bg-white text-black font-bold active:bg-zinc-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView key="home" />;
      case 'wallet': return <WalletView key="wallet" />;
      case 'trade': return <TradeView key="trade" />;
      case 'support': return <SupportView key="support" />;
      case 'profile': return <ProfileView key="profile" />;
      default: return <HomeView key="default" />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="bg-black min-h-screen text-zinc-100 font-sans select-none">
        <AnimatePresence mode="wait">
            {isLoading ? (
                <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
            ) : (
                <div 
                    key="app" 
                    className="min-h-screen pb-24 transition-all duration-300"
                    style={{ 
                        paddingTop: isFullscreen ? 'var(--safe-top, 0px)' : '0px'
                    }}
                >
                    <div className="p-4">
                        {renderContent()}
                    </div>

                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {activeMarket === 'crypto' && (
                <CryptoScreen key="crypto-screen" onClose={handleCloseMarket} />
            )}
            {activeMarket === 'screener' && (
                <ScreenerScreen key="screener-screen" onClose={handleCloseMarket} />
            )}
        </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

const MANIFEST_URL =
  import.meta.env.VITE_TONCONNECT_MANIFEST_URL ||
  `${import.meta.env.BASE_URL}tonconnect-manifest.json`;

export default function App() {
  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      actionsConfiguration={{ twaReturnUrl: 'https://t.me/io_sdbot' }}
    >
      <MainApp />
    </TonConnectUIProvider>
  );
}
