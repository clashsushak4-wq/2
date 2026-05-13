import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, X, MessageCircle } from 'lucide-react';
import { api } from '../../../../api/client';
import type { SupportTicketDetail, TicketMessage } from '../../../../api/client';
import { useToastStore } from '../../../../shared/ui';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface TicketChatProps {
  ticketId: number;
  onTicketUpdated: () => void;
}

const POLL_INTERVAL = 5000;

export const TicketChat = ({ ticketId, onTicketUpdated }: TicketChatProps) => {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToastStore((s) => s.add);

  const fetchTicket = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.support.getTicket(ticketId);
      if (signal?.aborted) return;
      setTicket(data);
    } catch (e: any) {
      if (signal?.aborted) return;
      toast(e?.message || 'Ошибка загрузки тикета', 'error');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [ticketId, toast]);

  useEffect(() => {
    setIsLoading(true);
    setTicket(null);
    const controller = new AbortController();
    fetchTicket(controller.signal);

    const interval = setInterval(() => {
      fetchTicket(controller.signal);
    }, POLL_INTERVAL);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [ticketId, fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  const handleSend = async (text: string) => {
    try {
      const newMsg: TicketMessage = await api.support.sendMessage(ticketId, text);
      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
      onTicketUpdated();
    } catch (e: any) {
      toast(e?.message || 'Не удалось отправить', 'error');
    }
  };

  const handleClose = async () => {
    setShowCloseConfirm(false);
    setIsClosing(true);
    try {
      await api.support.closeTicket(ticketId);
      toast('Тикет закрыт');
      onTicketUpdated();
      await fetchTicket();
    } catch (e: any) {
      toast(e?.message || 'Не удалось закрыть тикет', 'error');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading && !ticket) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <MessageCircle size={28} className="text-zinc-700 mb-3" />
        <p className="text-zinc-500 text-xs">Тикет не найден</p>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed';
  const initial = (ticket.user_nick || 'U')[0].toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {ticket.user_nick || `User #${ticket.user_id}`}
          </p>
          <p className="text-[10px] text-zinc-500">
            #{ticket.id} · ID {ticket.user_id} · {ticket.status === 'new' ? 'Новый' : ticket.status === 'in_progress' ? 'В работе' : 'Закрыт'}
          </p>
        </div>
        {!isClosed && !showCloseConfirm && (
          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={isClosing}
            className="h-9 px-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isClosing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            Закрыть
          </button>
        )}
        {!isClosed && showCloseConfirm && (
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 text-[11px]">Закрыть тикет?</span>
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Да
            </button>
            <button
              onClick={() => setShowCloseConfirm(false)}
              disabled={isClosing}
              className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-[11px] font-medium hover:bg-zinc-700 transition-colors"
            >
              Нет
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {ticket.messages.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs mt-10">Сообщений пока нет</div>
        ) : (
          ticket.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput disabled={isClosed} onSend={handleSend} />
    </div>
  );
};
