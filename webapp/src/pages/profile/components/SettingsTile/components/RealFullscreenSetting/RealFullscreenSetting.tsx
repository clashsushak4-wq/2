import { Expand, Shrink, ChevronRight } from 'lucide-react';
import { useWebApp } from '../../../../../../hooks';
import { useTranslation } from '../../../../../../i18n';
import { useState, useEffect } from 'react';

export const RealFullscreenSetting = () => {
  const { webApp } = useWebApp();
  const { t } = useTranslation();
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (webApp) {
      setIsFullscreen(webApp.isFullscreen || false);
      
      const onFullscreenChanged = () => {
        setIsFullscreen(webApp.isFullscreen || false);
      };
      
      if (webApp.onEvent) {
        webApp.onEvent('fullscreenChanged', onFullscreenChanged);
        return () => {
          if (webApp.offEvent) webApp.offEvent('fullscreenChanged', onFullscreenChanged);
        }
      }
    }
  }, [webApp]);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      if (webApp?.exitFullscreen) {
        webApp.exitFullscreen();
      } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    } else {
      if (webApp?.requestFullscreen) {
        webApp.requestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    }
  };

  const Icon = isFullscreen ? Shrink : Expand;

  return (
    <button
      onClick={toggleFullscreen}
      className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-xl active:bg-zinc-800 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
        <Icon size={18} className="text-black" />
      </div>
      <span className="flex-1 text-white text-base">{t('settings.realFullscreen')}</span>
      <span className="text-zinc-500 text-sm mr-1">
        {isFullscreen ? t('common.on') : t('common.off')}
      </span>
      <ChevronRight size={16} className="text-zinc-600 shrink-0" />
    </button>
  );
};
