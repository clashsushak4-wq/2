import type { TicketMessage } from '../../../../api/client';

interface MessageBubbleProps {
  message: TicketMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAdmin = message.sender === 'admin';
  const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isAdmin
            ? 'bg-white text-black rounded-br-md'
            : 'bg-zinc-800 text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-zinc-600' : 'text-zinc-500'}`}>{time}</p>
      </div>
    </div>
  );
};
