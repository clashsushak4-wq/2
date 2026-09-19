import { useCryptoStore } from '../store/useCryptoStore';
import { useInstrument } from '../store/useCryptoStore';

export const useOrderCalculations = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const availableBalance = useCryptoStore(state => state.availableBalance);
  const leverage = useCryptoStore(state => state.leverage);
  const price = useCryptoStore(state => state.price);
  const amountPercent = useCryptoStore(state => state.amountPercent);

  const instrument = useInstrument(selectedSymbol);
  const parsedPrice = parseFloat(price) || instrument.price;

  // Макс. для открытия = (Доступный баланс * Плечо) / Цена
  const maxToOpen = (availableBalance * leverage) / parsedPrice;

  // Объем базового актива
  const baseAmount = maxToOpen * (amountPercent / 100);

  // Требуемая маржа (Cost) = (Объем * Цена) / Плечо
  // Это должно быть примерно равно: availableBalance * (amountPercent / 100)
  const quoteCost = (baseAmount * parsedPrice) / leverage;

  // Примерная комиссия (Maker/Taker усредненно 0.04% для мока)
  const fee = baseAmount * parsedPrice * 0.0004;

  return {
    maxToOpen,
    baseAmount,
    quoteCost,
    fee,
    parsedPrice,
  };
};
