import type { InstrumentSpec, OrderIntent, TradeDirection, UnitType } from './types';

export const getStepDecimals = (step: number): number => {
  const normalized = step.toString().toLowerCase();
  if (normalized.includes('e-')) return Number(normalized.split('e-')[1]);
  return normalized.includes('.') ? normalized.split('.')[1].length : 0;
};

export const roundToStep = (
  value: number,
  step: number,
  mode: 'nearest' | 'floor' | 'ceil' = 'nearest',
): number => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return 0;
  const ratio = value / step;
  const rounded = mode === 'floor' ? Math.floor(ratio) : mode === 'ceil' ? Math.ceil(ratio) : Math.round(ratio);
  return Number((rounded * step).toFixed(getStepDecimals(step)));
};

export const formatByStep = (value: number, step: number): string => (
  Number.isFinite(value) ? value.toFixed(getStepDecimals(step)) : ''
);

export const calculateLiquidationPrice = (
  direction: TradeDirection,
  entryPrice: number,
  leverage: number,
  maintenanceMarginRate: number,
): number => {
  if (entryPrice <= 0 || leverage <= 0) return 0;
  const leverageDistance = 1 / leverage;
  const multiplier = direction === 'long'
    ? 1 - leverageDistance + maintenanceMarginRate
    : 1 + leverageDistance - maintenanceMarginRate;
  return Math.max(0, entryPrice * multiplier);
};

export const calculatePnl = (
  direction: TradeDirection,
  quantity: number,
  entryPrice: number,
  markPrice: number,
): number => {
  const priceDelta = direction === 'long' ? markPrice - entryPrice : entryPrice - markPrice;
  return priceDelta * quantity;
};

export interface OrderEstimateInput {
  intent?: OrderIntent;
  unit: UnitType;
  inputValue: number;
  price: number;
  leverage: number;
  availableBalance: number;
  orderType: 'limit' | 'market';
  maxCloseQuantity?: number;
  spec: InstrumentSpec;
}

export interface OrderEstimate {
  quantity: number;
  notional: number;
  requiredMargin: number;
  fee: number;
  totalRequired: number;
  maxQuantity: number;
  maxNotional: number;
  percent: number;
  feeRate: number;
}

export const calculateOrderEstimate = ({
  intent = 'open',
  unit,
  inputValue,
  price,
  leverage,
  availableBalance,
  orderType,
  maxCloseQuantity = 0,
  spec,
}: OrderEstimateInput): OrderEstimate => {
  const feeRate = orderType === 'limit' ? spec.makerFeeRate : spec.takerFeeRate;
  const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
  const safeLeverage = Math.max(1, Math.min(leverage, spec.maxLeverage));
  const safeBalance = Math.max(0, availableBalance);
  const maxQuantity = intent === 'close'
    ? roundToStep(Math.max(0, maxCloseQuantity), spec.quantityStep, 'floor')
    : safePrice > 0
      ? roundToStep(
        (safeBalance / ((1 / safeLeverage) + feeRate)) / safePrice,
        spec.quantityStep,
        'floor',
      )
      : 0;
  const maxNotional = maxQuantity * safePrice;

  let rawQuantity = 0;
  if (safePrice > 0 && inputValue > 0) {
    if (unit === 'qty_base') rawQuantity = inputValue;
    if (unit === 'cost_quote') rawQuantity = (inputValue * safeLeverage) / safePrice;
    if (unit === 'value_quote') rawQuantity = inputValue / safePrice;
  }

  const quantity = roundToStep(rawQuantity, spec.quantityStep, 'floor');
  const notional = quantity * safePrice;
  const requiredMargin = intent === 'close' ? 0 : notional / safeLeverage;
  const fee = notional * feeRate;
  const totalRequired = requiredMargin + fee;
  const percent = intent === 'close'
    ? maxQuantity > 0 ? Math.min(100, Math.max(0, (quantity / maxQuantity) * 100)) : 0
    : safeBalance > 0 ? Math.min(100, Math.max(0, (totalRequired / safeBalance) * 100)) : 0;

  return {
    quantity,
    notional,
    requiredMargin,
    fee,
    totalRequired,
    maxQuantity,
    maxNotional,
    percent,
    feeRate,
  };
};

export const amountValueFromQuantity = (
  unit: UnitType,
  quantity: number,
  price: number,
  leverage: number,
): number => {
  if (unit === 'qty_base') return quantity;
  const notional = quantity * price;
  if (unit === 'cost_quote') return leverage > 0 ? notional / leverage : 0;
  return notional;
};
