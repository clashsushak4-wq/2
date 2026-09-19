import { toInstrumentSpec } from '../data/mockInstruments';
import {
  calculateLiquidationPrice,
  calculateOrderEstimate,
} from '../domain/orderCalculations';
import { normalizePrice } from '../domain/orderNormalization';
import { validateOrder } from '../domain/orderValidation';
import { calculateAvailableCloseQuantity } from '../engine/paperTradingEngine';
import { useCryptoStore, useInstrument } from '../store/useCryptoStore';
import { calculatePaperAccount, usePaperTradingStore } from '../store/usePaperTradingStore';

export const useOrderCalculations = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const leverage = useCryptoStore(state => state.leverage);
  const orderType = useCryptoStore(state => state.orderType);
  const price = useCryptoStore(state => state.price);
  const unit = useCryptoStore(state => state.unit);
  const amountValue = useCryptoStore(state => state.amountValue);
  const orderIntent = useCryptoStore(state => state.orderIntent);

  const walletBalance = usePaperTradingStore(state => state.walletBalance);
  const realizedPnl = usePaperTradingStore(state => state.realizedPnl);
  const paidFees = usePaperTradingStore(state => state.paidFees);
  const orders = usePaperTradingStore(state => state.orders);
  const fills = usePaperTradingStore(state => state.fills);
  const positions = usePaperTradingStore(state => state.positions);
  const ledger = usePaperTradingStore(state => state.ledger);

  const instrument = useInstrument(selectedSymbol);
  const spec = toInstrumentSpec(instrument);
  const parsedLimitPrice = price.trim() === '' ? 0 : normalizePrice(Number(price), spec);
  const parsedPrice = orderType === 'market' ? normalizePrice(instrument.price, spec) : parsedLimitPrice;
  const parsedAmount = amountValue.trim() === '' ? 0 : Number(amountValue);
  const account = calculatePaperAccount({
    walletBalance,
    realizedPnl,
    paidFees,
    orders,
    fills,
    positions,
    ledger,
  });
  const position = positions.find((item) => item.symbol === selectedSymbol) ?? null;
  const maxCloseQuantity = position
    ? calculateAvailableCloseQuantity(
      positions,
      orders,
      selectedSymbol,
      position.direction,
    )
    : 0;
  const estimate = calculateOrderEstimate({
    intent: orderIntent,
    unit,
    inputValue: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    price: parsedPrice,
    leverage,
    availableBalance: account.availableBalance,
    orderType,
    maxCloseQuantity,
    spec,
  });
  const validationErrors = validateOrder({
    intent: orderIntent,
    orderType,
    price: parsedPrice,
    marketPrice: instrument.price,
    quantity: estimate.quantity,
    notional: estimate.notional,
    totalRequired: estimate.totalRequired,
    availableBalance: account.availableBalance,
    leverage,
    hasClosePosition: position !== null,
    maxCloseQuantity,
    positionLeverage: position?.leverage,
    spec,
  });

  return {
    ...estimate,
    spec,
    account,
    position,
    availableBalance: account.availableBalance,
    maxToOpen: estimate.maxQuantity,
    maxToClose: maxCloseQuantity,
    maxToCloseLong: position?.direction === 'long' ? maxCloseQuantity : 0,
    maxToCloseShort: position?.direction === 'short' ? maxCloseQuantity : 0,
    baseAmount: estimate.quantity,
    quoteCost: estimate.requiredMargin,
    parsedPrice,
    liqPriceLong: calculateLiquidationPrice('long', parsedPrice, leverage, spec.maintenanceMarginRate),
    liqPriceShort: calculateLiquidationPrice('short', parsedPrice, leverage, spec.maintenanceMarginRate),
    validationErrors,
    isValid: validationErrors.length === 0,
  };
};
