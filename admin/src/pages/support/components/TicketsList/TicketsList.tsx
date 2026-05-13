import { Loader2, Inbox } from 'lucide-react';
import type { SupportTicket } from '../../../../api/client';
import { TicketCard } from './TicketCard';

interface TicketsListProps {
  tickets: SupportTicket[];
  selectedId: number | null;
  onSelect: (ticket: SupportTicket) => void;
  isLoading: boolean;
}

export const TicketsList = ({ tickets, selectedId, onSelect, isLoading }: TicketsListProps) => {
  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox size={28} className="text-zinc-700 mb-3" />
        <p className="text-zinc-500 text-xs">Тикетов нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          isActive={selectedId === ticket.id}
          onClick={() => onSelect(ticket)}
        />
      ))}
    </div>
  );
};
