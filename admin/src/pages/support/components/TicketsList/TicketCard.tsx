import type { SupportTicket } from '../../../../api/client';

interface TicketCardProps {
  ticket: SupportTicket;
  isActive: boolean;
  onClick: () => void;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export const TicketCard = ({ ticket, isActive, onClick }: TicketCardProps) => {
  const initial = (ticket.user_nick || 'U')[0].toUpperCase();
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-colors ${
        isActive
          ? 'bg-white/10 border-zinc-600'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white truncate">
              {ticket.user_nick || `User #${ticket.user_id}`}
            </p>
            <span className="text-[10px] text-zinc-500 shrink-0">
              {formatDate(ticket.updated_at)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">#{ticket.id} · ID {ticket.user_id}</p>
        </div>
      </div>
    </button>
  );
};
