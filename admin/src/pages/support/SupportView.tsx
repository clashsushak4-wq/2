import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { StatusTabs, TicketsList, TicketChat } from './components';
import { useAdminTickets } from './hooks';

export const SupportView = () => {
  const {
    status,
    tickets,
    selectedId,
    counts,
    isLoading,
    setSelectedId,
    handleStatusChange,
    handleTicketUpdated,
  } = useAdminTickets();

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

