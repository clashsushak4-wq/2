import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { TAP_TILE } from '../../../../shared/animations';

interface MarketTileProps {
  icon: LucideIcon;
  title: string;
  subtitleKey: string;
  onClick?: () => void;
}

export const MarketTile = ({ icon: Icon, title, subtitleKey, onClick }: MarketTileProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={`bg-zinc-900 border-2 border-zinc-700 rounded-xl px-4 py-3 ${TAP_TILE} relative overflow-hidden w-full flex items-center gap-3 text-left`}
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-white/5 to-transparent rounded-br-full pointer-events-none" />
      
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 relative z-10">
        <Icon size={20} className="text-white" />
      </div>
      
      <div className="flex-1 relative z-10">
        <p className="text-white text-base font-bold">{title}</p>
        <p className="text-zinc-500 text-sm mt-0.5">{t(subtitleKey)}</p>
      </div>
    </button>
  );
};
