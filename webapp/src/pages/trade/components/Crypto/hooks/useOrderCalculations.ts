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

  // Примерная комиссия (Maker/Taker усредненно 0.04% для мока) от НОМИНАЛЬНОГО объема (с учетом плеча)
  const fee = baseAmount * parsedPrice * 0.0004;

  // Ориентировочная цена ликвидации для лонга и шорта (Isolated Margin, simplified)
  let liqPriceLong = 0;
  let liqPriceShort = 0;
  if (baseAmount > 0) {
    liqPriceLong = parsedPrice * (1 - 1 / leverage);
    liqPriceShort = parsedPrice * (1 + 1 / leverage);
  }

  // Валидация: объем не 0 и хватает средств на маржу + комиссию
  const isValid = amountPercent > 0 && (quoteCost + fee) <= availableBalance && quoteCost > 0;

  return {
    maxToOpen,
    baseAmount,
    quoteCost,
    fee,
    parsedPrice,
    liqPriceLong,
    liqPriceShort,
    isValid,
  };
};
