import { roundToStep } from './orderCalculations.ts';

export const calculateCloseQuantityByPercent = (
  positionQuantity: number,
  percent: number,
  quantityStep: number,
): number => {
  if (!Number.isFinite(positionQuantity) || positionQuantity <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  const boundedPercent = Math.min(100, percent);
  return roundToStep(
    positionQuantity * (boundedPercent / 100),
    quantityStep,
    'floor',
  );
};
