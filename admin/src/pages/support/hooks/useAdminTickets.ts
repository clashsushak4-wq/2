import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../api/client';
import type { SupportTicket, TicketStatus, SupportCounts } from '../../../api/client';

const POLL_INTERVAL = 5000;

export const useAdminTickets = (initialStatus: TicketStatus = 'new') => {
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
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

  const handleStatusChange = useCallback((newStatus: TicketStatus) => {
    setStatus(newStatus);
    setSelectedId(null);
  }, []);

  const handleTicketUpdated = useCallback(() => {
    loadTickets(status);
    loadCounts();
  }, [status, loadTickets, loadCounts]);

  return {
    status,
    tickets,
    selectedId,
    counts,
    isLoading,
    setSelectedId,
    handleStatusChange,
    handleTicketUpdated,
  };
};
