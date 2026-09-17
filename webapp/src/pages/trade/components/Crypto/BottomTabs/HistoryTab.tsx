import { useTranslation } from '../../../../../i18n';

export const HistoryTab = () => {
  const { t } = useTranslation();

  return (
    <div className="px-2 py-8 flex flex-col items-center justify-center text-zinc-500">
      <span className="text-sm">{t('trade.emptyHistory')}</span>
    </div>
  );
};
