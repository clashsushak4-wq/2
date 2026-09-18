import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { haptic } from '../../utils';
import {
  getPullProgress,
  getResistedPullDistance,
  REFRESH_HOLD_DISTANCE,
  REFRESH_THRESHOLD,
} from './pullToRefreshMotion.ts';

type PullStatus = 'idle' | 'pulling' | 'ready' | 'refreshing';
type PullLayout = 'contained' | 'document';

interface PullToRefreshProps {
  children: ReactNode;
  disabled?: boolean;
  layout?: PullLayout;
  onRefresh: () => Promise<void> | void;
}

interface PullIndicatorProps {
  distance: number;
  isDragging: boolean;
  status: PullStatus;
}

const PullIndicator = ({ distance, isDragging, status }: PullIndicatorProps) => {
  const { t } = useTranslation();
  const progress = getPullProgress(distance);
  const arrowOffset = 2 + progress * 9;
  const isRefreshing = status === 'refreshing';
  const labelKey = status === 'ready'
    ? 'common.releaseToRefresh'
    : status === 'refreshing'
      ? 'common.refreshing'
      : 'common.pullToRefresh';

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 flex items-center justify-center overflow-hidden"
      style={{
        height: distance,
        transition: isDragging ? 'none' : 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      aria-live="polite"
      aria-label={t(labelKey)}
      aria-hidden={distance === 0}
    >
      <div
        className="flex flex-col items-center gap-0.5"
        style={{
          opacity: Math.min(progress * 1.7, 1),
          transform: `translateY(${Math.max(0, distance * 0.08)}px) scale(${0.82 + progress * 0.18})`,
        }}
      >
        <div className={`flex h-6 items-center justify-center ${status === 'ready' || isRefreshing ? 'text-white' : 'text-zinc-400'}`}>
          {isRefreshing ? (
            <RefreshCw size={19} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <div className="flex w-14 items-center justify-center">
              <ChevronLeft
                size={21}
                strokeWidth={2.7}
                style={{ transform: `translateX(-${arrowOffset}px)` }}
              />
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${status === 'ready' ? 'bg-white' : 'bg-zinc-600'}`}
              />
              <ChevronRight
                size={21}
                strokeWidth={2.7}
                style={{ transform: `translateX(${arrowOffset}px)` }}
              />
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium leading-none text-zinc-400">
          {t(labelKey)}
        </span>
      </div>
    </div>
  );
};

export const PullToRefresh = ({
  children,
  disabled = false,
  layout = 'contained',
  onRefresh,
}: PullToRefreshProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const distanceRef = useRef(0);
  const isTrackingRef = useRef(false);
  const thresholdReachedRef = useRef(false);
  const statusRef = useRef<PullStatus>('idle');
  const refreshTimerRef = useRef<number>();
  const onRefreshRef = useRef(onRefresh);
  const [distance, setDistance] = useState(0);
  const [status, setStatus] = useState<PullStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    let isDisposed = false;

    const isAtTop = () => layout === 'document'
      ? window.scrollY <= 0 && document.documentElement.scrollTop <= 0
      : element.scrollTop <= 0;

    const updateDistance = (nextDistance: number) => {
      distanceRef.current = nextDistance;
      setDistance(nextDistance);
    };

    const updateStatus = (nextStatus: PullStatus) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
    };

    const reset = () => {
      isTrackingRef.current = false;
      thresholdReachedRef.current = false;
      setIsDragging(false);
      updateStatus('idle');
      updateDistance(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const shouldIgnore = target?.closest('[data-pull-to-refresh-ignore]');

      if (disabled || shouldIgnore || statusRef.current === 'refreshing' || event.touches.length !== 1 || !isAtTop()) {
        isTrackingRef.current = false;
        return;
      }

      const touch = event.touches[0];
      startPointRef.current = { x: touch.clientX, y: touch.clientY };
      isTrackingRef.current = true;
      thresholdReachedRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTrackingRef.current || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaY = touch.clientY - startPointRef.current.y;
      const deltaX = Math.abs(touch.clientX - startPointRef.current.x);

      if (!isAtTop() || deltaY <= 0 || deltaX > deltaY) {
        reset();
        return;
      }

      if (event.cancelable) event.preventDefault();

      const nextDistance = getResistedPullDistance(deltaY);
      const isReady = nextDistance >= REFRESH_THRESHOLD;

      if (isReady && !thresholdReachedRef.current) {
        thresholdReachedRef.current = true;
        haptic.light();
      }

      setIsDragging(true);
      updateStatus(isReady ? 'ready' : 'pulling');
      updateDistance(nextDistance);
    };

    const handleTouchEnd = () => {
      if (!isTrackingRef.current) return;

      const shouldRefresh = distanceRef.current >= REFRESH_THRESHOLD;
      isTrackingRef.current = false;
      setIsDragging(false);

      if (!shouldRefresh) {
        updateStatus('idle');
        updateDistance(0);
        return;
      }

      updateStatus('refreshing');
      updateDistance(REFRESH_HOLD_DISTANCE);
      haptic.medium();

      void Promise.resolve()
        .then(() => onRefreshRef.current())
        .then(() => haptic.success())
        .catch(() => haptic.error())
        .finally(() => {
          if (!isDisposed) {
            refreshTimerRef.current = window.setTimeout(reset, 260);
          }
        });
    };

    const handleTouchCancel = () => reset();

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      isDisposed = true;
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [disabled, layout]);

  useEffect(() => () => {
    if (refreshTimerRef.current !== undefined) {
      window.clearTimeout(refreshTimerRef.current);
    }
  }, []);

  const rootClassName = layout === 'document'
    ? 'relative bg-black overscroll-none'
    : 'relative h-full overflow-hidden bg-black overscroll-none';
  const contentClassName = layout === 'document'
    ? 'relative z-10 flex flex-col bg-black overscroll-none'
    : 'absolute inset-0 z-10 flex flex-col overflow-y-auto bg-black overscroll-none custom-scrollbar will-change-transform';
  const contentStyle = layout === 'document'
    ? {
        top: distance,
        transition: isDragging ? 'none' : 'top 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'top',
      }
    : {
        transform: `translate3d(0, ${distance}px, 0)`,
        transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      };

  return (
    <div className={rootClassName}>
      <PullIndicator distance={distance} isDragging={isDragging} status={status} />
      <div
        ref={contentRef}
        className={contentClassName}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  );
};
