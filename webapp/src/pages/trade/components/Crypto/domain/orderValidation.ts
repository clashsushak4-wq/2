import type { InstrumentSpec, OrderIntent } from './types.ts';
import { isCleanNumber } from './orderNormalization.ts';

export type OrderValidationCode =
  | 'amount_required'
  | 'instrument_mismatch'
  | 'price_required'
  | 'price_out_of_band'
  | 'quantity_step_invalid'
  | 'quantity_below_minimum'
  | 'notional_below_minimum'
  | 'insufficient_margin'
  | 'invalid_leverage'
  | 'position_not_found'
  | 'close_quantity_exceeded'
  | 'invalid_leverage_for_position';

interface ValidateOrderInput {
  intent?: OrderIntent;
  symbol?: string;
  orderType: 'limit' | 'market';
  price: number;
  marketPrice: number;
  quantity: number;
  notional: number;
  totalRequired: number;
  availableBalance: number;
  leverage: number;
  hasClosePosition?: boolean;
  maxCloseQuantity?: number;
  positionLeverage?: number;
  spec: InstrumentSpec;
}

export const validateOrder = ({
  intent = 'open',
  symbol,
  orderType,
  price,
  marketPrice,
  quantity,
  notional,
  totalRequired,
  availableBalance,
  leverage,
  hasClosePosition = false,
  maxCloseQuantity = 0,
  positionLeverage,
  spec,
}: ValidateOrderInput): OrderValidationCode[] => {
  const errors: OrderValidationCode[] = [];
  if (symbol && symbol !== spec.symbol) errors.push('instrument_mismatch');
  if (!isCleanNumber(quantity) || quantity <= 0) errors.push('amount_required');
  if (
    quantity > 0
    && Math.abs((quantity / spec.quantityStep) - Math.round(quantity / spec.quantityStep)) > 1e-8
  ) errors.push('quantity_step_invalid');
  if (orderType === 'limit' && (!isCleanNumber(price) || price <= 0)) {
    errors.push('price_required');
  }
  
  if (intent === 'close') {
    if (!hasClosePosition) errors.push('position_not_found');
    if (hasClosePosition && quantity > maxCloseQuantity + Number.EPSILON) {
      errors.push('close_quantity_exceeded');
    }
  } else {
    if (quantity > 0 && quantity < spec.minQuantity) errors.push('quantity_below_minimum');
    if (notional > 0 && notional < spec.minNotional) errors.push('notional_below_minimum');
    if (totalRequired > availableBalance + Number.EPSILON) errors.push('insufficient_margin');
    if (leverage < 1 || leverage > spec.maxLeverage) errors.push('invalid_leverage');
    if (positionLeverage !== undefined && leverage !== positionLeverage) {
      errors.push('invalid_leverage_for_position');
    }
  }

  if (orderType === 'limit' && isCleanNumber(price) && price > 0 && marketPrice > 0) {
    const distance = Math.abs(price - marketPrice) / marketPrice;
    if (distance > spec.priceBandPercent) errors.push('price_out_of_band');
  }

  return [...new Set(errors)];
};
