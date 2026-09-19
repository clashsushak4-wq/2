import { roundToStep } from './orderCalculations.ts';
import type { InstrumentSpec } from './types.ts';

export const isCleanNumber = (value: number | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  return Number.isFinite(value) && !Number.isNaN(value);
};

export const normalizePrice = (price: number, spec: InstrumentSpec): number => {
  if (!isCleanNumber(price) || price <= 0) return 0;
  return roundToStep(price, spec.tickSize);
};

export const normalizeQuantity = (quantity: number, spec: InstrumentSpec): number => {
  if (!isCleanNumber(quantity) || quantity <= 0) return 0;
  return roundToStep(quantity, spec.quantityStep, 'floor');
};
