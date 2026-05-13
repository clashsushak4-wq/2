import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';
import type { SupportTicket, TicketStatus, SupportCounts } from '../../api/client';
import { StatusTabs, TicketsList, TicketChat } from './components';

const POLL_INTERVAL = 5000;

export const SupportView = () => {
  const [status, setStatus] = useState<TicketStatus>('new');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [counts, setCounts] = useState<SupportCounts>({ new: 0, active: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const data = await api.support.getCounts();
      setCounts(data);
    } catch {
      // silent
    }
  }, []);

  const loadTickets = useCallback(async (st: TicketStatus, signal?: AbortSignal) => {
    try {
      const data = await api.support.getTickets(st);
      if (signal?.aborted) return;
      setTickets(data);
    } catch {
      if (!signal?.aborted) setTickets([]);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  // Load tickets on status change + polling
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    loadTickets(status, controller.signal);
    loadCounts();

    const interval = setInterval(() => {
      loadTickets(status, controller.signal);
      loadCounts();
    }, POLL_INTERVAL);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [status, loadTickets, loadCounts]);

  // If selected ticket is no longer in current list — clear selection
  useEffect(() => {
    if (selectedId && !tickets.find((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [tickets, selectedId]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    setStatus(newStatus);
    setSelectedId(null);
  };

  const handleTicketUpdated = useCallback(() => {
    loadTickets(status);
    loadCounts();
  }, [status, loadTickets, loadCounts]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="flex flex-col h-[calc(100vh-7rem)]"
    >
      <div className="mb-3">
        <StatusTabs active={status} onChange={handleStatusChange} counts={counts} />
      </div>

      {/* Mobile: stack with back button. Desktop: split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3">
        {/* Left: tickets list */}
        <div className={`min-h-0 overflow-y-auto pr-1 ${selectedId ? 'hidden md:block' : ''}`}>
          <TicketsList
            tickets={tickets}
            selectedId={selectedId}
            onSelect={(t) => setSelectedId(t.id)}
            isLoading={isLoading}
          />
        </div>

        {/* Right: chat */}
        <div className={`min-h-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${
          selectedId ? '' : 'hidden md:flex md:items-center md:justify-center'
        }`}>
          {selectedId ? (
            <div className="flex flex-col h-full">
              {/* Mobile back button */}
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 text-zinc-400 text-xs hover:text-white transition-colors border-b border-zinc-800"
              >
                <ArrowLeft size={14} />
                К списку
              </button>
              <div className="flex-1 min-h-0">
                <TicketChat
                  key={selectedId}
                  ticketId={selectedId}
                  onTicketUpdated={handleTicketUpdated}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <MessageCircle size={28} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-xs">Выберите тикет</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
