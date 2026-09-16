import { useEffect, useRef } from 'react';
import { useWebApp } from './useWebApp';

type Handler = { cb: () => void };

const handlerStack: Handler[] = [];
let isShown = false;
let dispatcherAttached = false;

const sync = (webApp: any) => {
  if (!webApp?.BackButton) return;
  const hasActive = handlerStack.length > 0;
  if (hasActive && !isShown) {
    webApp.BackButton.show();
    isShown = true;
  } else if (!hasActive && isShown) {
    webApp.BackButton.hide();
    isShown = false;
  }
};

const dispatch = () => {
  if (handlerStack.length === 0) return;
  // Берем последний обработчик (самый верхний активный слой)
  const lastHandler = handlerStack[handlerStack.length - 1];
  lastHandler.cb();
};

const attachDispatcher = (webApp: any) => {
  if (!webApp?.BackButton || dispatcherAttached) return;
  webApp.BackButton.onClick(dispatch);
  dispatcherAttached = true;
};

export const useBackButton = (onBack: (() => void) | null) => {
  const { webApp } = useWebApp();
  
  // Храним актуальный коллбэк в ref, чтобы не переподписывать effect при каждой смене функции
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const isActive = !!onBack;

  useEffect(() => {
    if (!webApp?.BackButton) return;
    attachDispatcher(webApp);

    if (isActive) {
      const handler: Handler = {
        cb: () => {
          if (onBackRef.current) {
            onBackRef.current();
          }
        }
      };
      
      handlerStack.push(handler);
      sync(webApp);

      return () => {
        const idx = handlerStack.indexOf(handler);
        if (idx >= 0) {
          handlerStack.splice(idx, 1);
        }
        sync(webApp);
      };
    }
  }, [isActive, webApp]);
};
