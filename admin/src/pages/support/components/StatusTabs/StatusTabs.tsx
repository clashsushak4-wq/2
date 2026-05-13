import type { TicketStatus } from '../../../../api/client';

interface StatusTabsProps {
  active: TicketStatus;
  onChange: (status: TicketStatus) => void;
  counts: { new: number; active: number; closed: number };
}

const TABS: { key: TicketStatus; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'closed', label: 'Закрытые' },
];

export const StatusTabs = ({ active, onChange, counts }: StatusTabsProps) => {
  const countFor = (status: TicketStatus): number => {
    if (status === 'new') return counts.new;
    if (status === 'in_progress') return counts.active;
    return counts.closed;
  };

  return (
    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = countFor(tab.key);
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
