import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { api } from '../../../api/client';
import { useTranslation } from '../../../i18n';

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
}

export const useSupportTicket = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const ticketIdRef = useRef<number | null>(null);
  
  // Держим актуальную t() в ref, чтобы избежать stale closure в polling-интервале.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTicket = async (allowCreateIfMissing: boolean, signal: AbortSignal) => {
      try {
        let ticketDetails;
        try {
          ticketDetails = await api.support.getMyTicket();
        } catch (error) {
          if (axios.isCancel(error)) return;
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if (allowCreateIfMissing && status === 404) {
            await api.support.createTicket();
            ticketDetails = await api.support.getMyTicket();
          } else {
            throw error;
          }
        }

        if (signal.aborted) return;
        ticketIdRef.current = ticketDetails.id;
        const formattedMessages = ticketDetails.messages.map((m: any) => ({
          id: m.id,
          text: m.text,
          isUser: m.sender === 'user',
          time: new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formattedMessages);
        setErrorText(null);
      } catch (error) {
        if (signal.aborted) return;
        console.error('Error fetching ticket', error);
        setErrorText(tRef.current('support.loadError'));
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    fetchTicket(true, controller.signal);

    const interval = setInterval(() => {
      if (ticketIdRef.current) fetchTicket(false, controller.signal);
    }, 5000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !ticketIdRef.current) return;
    
    try {
      const newMessage = await api.support.sendMessage(ticketIdRef.current, text);
      setMessages(prev => [...prev, {
        id: newMessage.id,
        text: newMessage.text,
        isUser: true,
        time: new Date(newMessage.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]);
      setErrorText(null);
    } catch (error) {
      console.error('Failed to send message', error);
      setErrorText(t('support.sendError'));
      throw error; // Let the UI handle it if needed
    }
  }, [t]);

  return {
    messages,
    isLoading,
    errorText,
    sendMessage,
  };
};
