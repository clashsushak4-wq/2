import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (text: string) => Promise<void>;
}

export const ChatInput = ({ disabled, onSend }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const text = value.trim();
    if (!text || disabled || isSending) return;
    setIsSending(true);
    try {
      await onSend(text);
      setValue('');
    } finally {
      setIsSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 border-t border-zinc-800 p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled || isSending}
        placeholder={disabled ? 'Тикет закрыт' : 'Введите ответ...'}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || isSending || !value.trim()}
        className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </div>
  );
};
