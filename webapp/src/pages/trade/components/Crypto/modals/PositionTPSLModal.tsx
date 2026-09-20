import { useMarketStore } from '../store/useMarketStore';
import { useEffect, useState } from 'react';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { roundToStep } from '../domain/orderCalculations';
import { isValidTriggerPrice } from '../domain/tpslCalculations';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

interface PositionTPSLModalProps {
  symbol: string | null;
  onClose: () => void;
}

export const PositionTPSLModal = ({ symbol, onClose }: PositionTPSLModalProps) => {
  const { t } = useTranslation();
  const instrument = useMarketStore(state => symbol ? state.instruments[symbol] : undefined);
  const position = usePaperTradingStore(state => state.positions.find((item) => item.symbol === symbol));
  const updatePositionTPSL = usePaperTradingStore.getState().updatePositionTPSL;
  const showToast = useCryptoStore.getState().showToast;
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const isOpen = symbol !== null && position !== undefined && instrument !== undefined;

  useBackButton(isOpen ? onClose : null);

  useEffect(() => {
    if (!isOpen || !position || !instrument) return;
    setTakeProfit(position.tpsl.takeProfitPrice?.toFixed(instrument.priceDecimals) ?? '');
    setStopLoss(position.tpsl.stopLossPrice?.toFixed(instrument.priceDecimals) ?? '');
    setErrorKey(null);
    // Initialize only when the sheet opens for another symbol; market ticks must not overwrite user input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, symbol]);

  if (!position || !instrument) return null;

  const updateNumericValue = (setter: (value: string) => void, value: string) => {
    if (/^\d*(\.\d*)?$/.test(value)) {
      setter(value);
      setErrorKey(null);
    }
  };

  const handleSave = async () => {
    const tpPrice = takeProfit === '' ? null : Number(takeProfit);
    const slPrice = stopLoss === '' ? null : Number(stopLoss);
    if (tpPrice !== null && !isValidTriggerPrice('tp', position.direction, tpPrice, position.averageEntryPrice)) {
      setErrorKey('trade.validation_take_profit_direction');
      return;
    }
    if (slPrice !== null && !isValidTriggerPrice('sl', position.direction, slPrice, position.averageEntryPrice)) {
      setErrorKey('trade.validation_stop_loss_direction');
      return;
    }

    haptic.medium();
    const result = await updatePositionTPSL(position.symbol, {
      takeProfitPrice: tpPrice === null ? null : roundToStep(tpPrice, instrument.tickSize),
      stopLossPrice: slPrice === null ? null : roundToStep(slPrice, instrument.tickSize),
    });
    showToast(t(`trade.action_${result.code}`), result.ok ? 'success' : 'error');
    if (!result.ok) return;
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.editTpsl')}>
      <div className="flex flex-col gap-3 pb-1">
        <label className="rounded-xl bg-black px-3 py-2">
          <span className="block text-[11px] text-zinc-500">TP ({instrument.quoteAsset})</span>
          <input
            type="text"
            inputMode="decimal"
            value={takeProfit}
            placeholder="0"
            onChange={(event) => updateNumericValue(setTakeProfit, event.target.value)}
            className="w-full bg-transparent text-base font-bold text-zinc-100 outline-none"
          />
        </label>
        <label className="rounded-xl bg-black px-3 py-2">
          <span className="block text-[11px] text-zinc-500">SL ({instrument.quoteAsset})</span>
          <input
            type="text"
            inputMode="decimal"
            value={stopLoss}
            placeholder="0"
            onChange={(event) => updateNumericValue(setStopLoss, event.target.value)}
            className="w-full bg-transparent text-base font-bold text-zinc-100 outline-none"
          />
        </label>
        {errorKey && <div role="alert" className="text-xs text-bitget-red">{t(errorKey)}</div>}
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-white py-2.5 font-bold text-black"
        >
          {t('common.save')}
        </button>
      </div>
    </BottomSheet>
  );
};
