import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Copy, AlertCircle, Share } from 'lucide-react';
import { useBackButton } from '../../../hooks';
import { slideFromRight } from '../../../shared/animations';

interface TokenReceiveScreenProps {
  currency: 'GRAM' | 'USDT';
  address: string;
  onClose: () => void;
}

export const TokenReceiveScreen = ({ currency, address, onClose }: TokenReceiveScreenProps) => {
  const [copied, setCopied] = useState(false);
  useBackButton(onClose);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Мой адрес ${currency}`,
        text: `Мой адрес для получения ${currency} в сети TON:`,
        url: address
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  const isGram = currency === 'GRAM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden md:bg-black/60 md:backdrop-blur-sm bg-black">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 md:relative md:inset-auto md:w-[480px] md:h-[85vh] md:rounded-3xl md:border md:border-zinc-800 md:shadow-2xl flex flex-col overflow-hidden bg-black md:bg-zinc-950"
      >
        {/* Header */}
        <div className="relative z-10 px-4 flex items-center justify-center pb-4 border-b border-white/10" style={{ paddingTop: 'calc(16px + var(--safe-top, 0px))' }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isGram ? 'bg-[#0098EA]' : 'bg-[#26A17B]'}`}>
              {isGram ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"/>
                </svg>
              ) : (
                <span className="text-white font-bold text-sm">₮</span>
              )}
            </div>
            Получить
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center" style={{ paddingBottom: 'calc(80px + var(--safe-bottom, 0px))' }}>
          
          {/* Main Card */}
          <div className="bg-[#1C1C1E] w-full rounded-3xl p-6 flex flex-col items-center border border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${isGram ? 'bg-[#0098EA]' : 'bg-[#26A17B]'}`} />
            
            <p className="text-white/60 font-medium mb-6 relative z-10">
              {currency} в сети TON
            </p>

            <div className={`p-4 rounded-3xl mb-8 relative z-10 ${isGram ? 'bg-[#0098EA]' : 'bg-[#26A17B]'}`}>
              <QRCode 
                value={address} 
                size={220}
                bgColor="transparent"
                fgColor="#ffffff"
                level="M"
              />
            </div>

            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="text-white/90 font-medium text-sm">Название адреса</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/50">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>

            <button 
              onClick={handleCopy}
              className="group flex flex-col items-center justify-center w-full bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-colors relative z-10"
            >
              <p className="text-white font-mono text-sm break-all text-center leading-relaxed">
                {address}
              </p>
              <div className="mt-2 flex items-center gap-1 text-white/50 group-hover:text-white/80">
                <Copy size={16} />
                <span className="text-xs font-medium">{copied ? "Скопировано!" : "Скопировать"}</span>
              </div>
            </button>

            <p className="text-center text-white/40 text-xs mt-6 px-4 leading-relaxed relative z-10">
              Отправляйте только {currency} в сети TON на этот адрес. Сумма меньше <span className="text-orange-400 font-medium">0.1 {currency}</span> может быть утеряна.
            </p>
          </div>

          {/* Attention Box */}
          <div className="w-full bg-[#1C1C1E] border border-orange-500/20 rounded-2xl p-4 mt-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-orange-500" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Обратите внимание!</p>
              <p className="text-white/60 text-xs mt-0.5">Это некастодиальный кошелек. Убедитесь, что отправитель поддерживает сеть TON.</p>
            </div>
          </div>

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl mt-8 flex items-center justify-center gap-2 shadow-lg"
          >
            <Share size={20} />
            Поделиться
          </button>
        </div>
      </motion.div>
    </div>
  );
};
