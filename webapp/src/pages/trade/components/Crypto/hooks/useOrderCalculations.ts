import { toInstrumentSpec } from '../data/marketData';
import {
  calculateOrderEstimate,
} from '../domain/orderCalculations';
import { normalizePrice } from '../domain/orderNormalization';
import { validateOrder } from '../domain/orderValidation';
import { calculateAvailableCloseQuantity } from '../domain/demoAccount';
import { useCryptoStore, useInstrument } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

export const useOrderCalculations = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const leverage = useCryptoStore(state => state.leverage);
  const orderType = useCryptoStore(state => state.orderType);
  const price = useCryptoStore(state => state.price);
  const unit = useCryptoStore(state => state.unit);
  const amountValue = useCryptoStore(state => state.amountValue);
  const orderIntent = useCryptoStore(state => state.orderIntent);

  const account = usePaperTradingStore(state => state.account);
  const orders = usePaperTradingStore(state => state.orders);
  const positions = usePaperTradingStore(state => state.positions);

  const instrument = useInstrument(selectedSymbol);
  const spec = toInstrumentSpec(instrument);
  const parsedLimitPrice = price.trim() === '' ? 0 : normalizePrice(Number(price), spec);
  const parsedPrice = orderType === 'market' ? normalizePrice(instrument.price, spec) : parsedLimitPrice;
  const parsedAmount = amountValue.trim() === '' ? 0 : Number(amountValue);
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
    leverage,
    validationErrors,
    isValid: validationErrors.length === 0,
  };
};
