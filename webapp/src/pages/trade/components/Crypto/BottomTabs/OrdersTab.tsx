import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';

export const OrdersTab = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <button type="button" className="flex items-center gap-2 cursor-pointer" onClick={() => haptic.light()}>
        <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center" />
        <span className="text-zinc-300 text-sm">{t('trade.showCurrent')}</span>
      </button>
      <button 
        type="button"
        className="bg-zinc-800 text-zinc-100 text-sm font-medium px-4 py-1.5 rounded-full transition-transform active:scale-95"
        onClick={() => haptic.light()}
      >
        {t('trade.cancelAll')}
      </button>
    </div>
  );
};
