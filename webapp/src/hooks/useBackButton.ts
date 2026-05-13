import { useEffect, useRef } from 'react';
import { useWebApp } from './useWebApp';

/**
 * Stack-based BackButton manager — поддерживает несколько одновременно
 * смонтированных компонентов (например TradeScreen + PairPicker).
 *
 * Активный обработчик — последний в стеке с непустым ref. Кнопка показана
 * пока есть хотя бы один активный обработчик.
 */
type Handler = { current: (() => void) | null };

const handlerStack: Handler[] = [];
let isShown = false;
let dispatcherAttached = false;
let attachedWebApp: any = null;

const hasActive = (): boolean => handlerStack.some((h) => !!h.current);

const sync = (webApp: any) => {
  if (!webApp?.BackButton) return;
  if (hasActive()) {
    if (!isShown) {
      webApp.BackButton.show();
      isShown = true;
    }
  } else if (isShown) {
    webApp.BackButton.hide();
    isShown = false;
  }
};

const dispatch = () => {
  // Активный — последний non-null handler в стеке (LIFO)
  for (let i = handlerStack.length - 1; i >= 0; i--) {
    const cb = handlerStack[i].current;
    if (cb) {
      cb();
      return;
    }
  }
};

const attachDispatcher = (webApp: any) => {
  if (!webApp?.BackButton || dispatcherAttached) return;
  webApp.BackButton.onClick(dispatch);
  dispatcherAttached = true;
  attachedWebApp = webApp;
};

export const useBackButton = (onBack: (() => void) | null) => {
  const { webApp } = useWebApp();
  const handlerRef = useRef<Handler>({ current: onBack });

  // Sync ref with latest callback на каждом ре-рендере (без перезапуска эффекта).
  handlerRef.current.current = onBack;

  useEffect(() => {
    if (!webApp?.BackButton) return;

    attachDispatcher(webApp);
    handlerStack.push(handlerRef.current);
    sync(webApp);

    return () => {
      const idx = handlerStack.lastIndexOf(handlerRef.current);
      if (idx >= 0) handlerStack.splice(idx, 1);
      sync(webApp);
    };
  }, [webApp]);

  // При смене null ↔ function пересинхронизировать видимость без перерегистрации.
  useEffect(() => {
    sync(webApp || attachedWebApp);
  }, [onBack, webApp]);
};
