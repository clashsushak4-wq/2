import { Bell, Bot, Zap } from 'lucide-react';
import { haptic } from '../../../../../../utils';

const ActionIconButton = ({ icon: Icon, label }: { icon: typeof Zap; label: string }) => (
  <button
    onClick={() => haptic.light()}
    className="flex min-w-[48px] flex-col items-center justify-center gap-1 text-white"
  >
    <Icon size={19} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const ChartTradeActions = () => (
  <div className="shrink-0 border-t border-zinc-900 bg-black px-4 pt-3 pb-[calc(12px+var(--safe-bottom,0px))]">
    <div className="flex items-center gap-2">
      <button
        onClick={() => haptic.medium()}
        className="h-12 flex-[1.15] rounded-lg bg-white text-[13px] font-bold text-black active:bg-zinc-200"
      >
        Лонг(Демо)
      </button>
      <button
        onClick={() => haptic.medium()}
        className="h-12 flex-[1.15] rounded-lg bg-violet-500 text-[13px] font-bold text-white active:bg-violet-600"
      >
        Шорт(Демо)
      </button>
      <div className="ml-1 flex flex-[1.35] items-center justify-between gap-1">
        <ActionIconButton icon={Zap} label="Быстрый" />
        <ActionIconButton icon={Bell} label="Алерт" />
        <ActionIconButton icon={Bot} label="Боты" />
      </div>
    </div>
  </div>
);
