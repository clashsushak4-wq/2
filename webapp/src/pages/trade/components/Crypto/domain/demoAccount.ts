import type { PaperAccount, PaperOrder, PaperPosition, TradeDirection } from './types';
import type { TradingSnapshot } from '../store/usePaperTradingStore';

export const oppositeDirection = (direction: TradeDirection): TradeDirection => direction === 'long' ? 'short' : 'long';

export const calculateAvailableCloseQuantity = (
  positions: PaperPosition[], orders: PaperOrder[], symbol: string, direction: TradeDirection,
): number => {
  const position = positions.find(item => item.symbol === symbol && item.direction === direction);
  if (!position) return 0;
  return Math.max(0, position.quantity - orders.filter(order => order.symbol === symbol && order.reduceOnly
    && (order.status === 'pending' || order.status === 'partially_filled')).reduce((sum, order) => sum + order.remainingQuantity, 0));
};

export const calculatePaperAccount = (state: TradingSnapshot): PaperAccount => state.account;
