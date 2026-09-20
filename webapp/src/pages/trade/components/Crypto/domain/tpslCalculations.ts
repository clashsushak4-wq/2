import type { TPSLMode, TradeDirection } from './types';

export type TPSLKind = 'tp' | 'sl';

interface TriggerPriceInput {
  mode: TPSLMode;
  value: number;
  kind: TPSLKind;
  direction: TradeDirection;
  entryPrice: number;
  leverage: number;
  quantity: number;
}

export const calculateTriggerPrice = ({
  mode,
  value,
  kind,
  direction,
  entryPrice,
  leverage,
  quantity,
}: TriggerPriceInput): number | null => {
  if (!Number.isFinite(value) || value <= 0 || entryPrice <= 0) return null;
  if (mode === 'price') return value;

  const favorable = (direction === 'long' && kind === 'tp') || (direction === 'short' && kind === 'sl');
  const sign = favorable ? 1 : -1;
  if (mode === 'change') return entryPrice * (1 + sign * (value / 100));
  if (mode === 'roi') return entryPrice * (1 + sign * (value / Math.max(1, leverage) / 100));
  if (mode === 'pnl' && quantity > 0) return entryPrice + sign * (value / quantity);
  return null;
};

export const isValidTriggerPrice = (
  kind: TPSLKind,
  direction: TradeDirection,
  triggerPrice: number | null,
  entryPrice: number,
): boolean => {
  if (triggerPrice === null || triggerPrice <= 0 || entryPrice <= 0) return false;
  if (direction === 'long') return kind === 'tp' ? triggerPrice > entryPrice : triggerPrice < entryPrice;
  return kind === 'tp' ? triggerPrice < entryPrice : triggerPrice > entryPrice;
};

export const calculateProjection = (
  mode: TPSLMode,
  value: number,
  entryPrice: number,
  leverage: number,
  quantity: number,
  direction: TradeDirection = 'long',
): { price: number; roi: number; pnl: number } | null => {
  if (!Number.isFinite(value) || value <= 0 || entryPrice <= 0 || quantity <= 0) return null;
  
  let price = 0;
  if (mode === 'price') {
    price = value;
  } else {
    const sign = direction === 'long' ? 1 : -1;
    if (mode === 'change') price = entryPrice * (1 + sign * (value / 100));
    else if (mode === 'roi') price = entryPrice * (1 + sign * (value / Math.max(1, leverage) / 100));
    else if (mode === 'pnl') price = entryPrice + sign * (value / quantity);
  }

  if (price <= 0) return null;

  const sign = direction === 'long' ? 1 : -1;
  const pnl = (price - entryPrice) * sign * quantity;
  const roi = ((price - entryPrice) / entryPrice) * sign * Math.max(1, leverage) * 100;

  return { price, roi, pnl };
};

