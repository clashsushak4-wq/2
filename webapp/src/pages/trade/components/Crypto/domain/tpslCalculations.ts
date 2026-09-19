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

