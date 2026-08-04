import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { NotificationModal } from './NotificationModal';

interface Props {
  onClick?: () => void;
  isActive?: boolean;
}

export const NotificationButton = ({ onClick, isActive }: Props = {}) => {
  const [showModal, setShowModal] = useState(false);
  const handleClose = useCallback(() => setShowModal(false), []);
  const hasUnread = false;

  return (
    <>
      <button 
        onClick={() => {
          if (onClick) onClick();
          else setShowModal(true);
        }}
        className={`relative p-3 rounded-xl border transition-transform duration-100 active:scale-[0.97] ${isActive ? 'bg-blue-500/20 border-blue-500/30' : 'bg-zinc-800 border-zinc-700'}`}
      >
        <Bell size={22} className={isActive ? 'text-blue-400' : 'text-zinc-300'} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-white rounded-full"></span>
        )}
      </button>

      <AnimatePresence>
        {showModal && (
          <NotificationModal onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
};
