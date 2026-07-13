import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Copy, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { fetchHistory, TransactionEvent } from '../../../utils/tonapi';
import { useBackButton } from '../../../hooks';
import { slideFromRight } from '../../../shared/animations';

interface TokenDetailScreenProps {
  currency: 'GRAM' | 'USDT';
  balance: string;
  address: string;
  currentPrice: number;
  onClose: () => void;
}

export const TokenDetailScreen = ({ currency, balance, address, currentPrice, onClose }: TokenDetailScreenProps) => {
  const [history, setHistory] = useState<TransactionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useBackButton(onClose);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async (showLoading = false) => {
      if (!address) return;
      if (showLoading) setIsLoading(true);
      try {
        const allHistory = await fetchHistory(address);
        const filtered = allHistory.filter(item => item.currency === currency);
        if (isMounted) {
          setHistory(filtered);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted && showLoading) setIsLoading(false);
      }
    };
    
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address, currency]);

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const balanceUsd = (parseFloat(balance) * currentPrice).toFixed(2);
  const isGram = currency === 'GRAM';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 bg-black flex flex-col"
      >
        <div className="bg-black px-4 pb-4 flex flex-col items-center justify-center pt-8" style={{ paddingTop: 'calc(32px + var(--safe-top, 0px))' }}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isGram ? 'bg-[#0098EA]' : 'bg-[#26A17B]'}`}>
            {isGram ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"/>
              </svg>
            ) : (
              <span className="text-white font-bold text-2xl">₮</span>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">{balance} {currency}</h1>
          <p className="text-zinc-400 text-sm">~${balanceUsd}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6" style={{ paddingBottom: 'calc(80px + var(--safe-bottom, 0px))' }}>
          {/* QR Код и Адрес */}
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex flex-col items-center mt-4">
            <p className="text-zinc-400 text-xs mb-4 text-center">
              Адрес для пополнения {currency} в сети The Open Network
            </p>
            <div className="bg-white p-3 rounded-2xl mb-4">
              <QRCode 
                value={address} 
                size={160} 
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            <div 
              onClick={handleCopy}
              className="flex items-center justify-between w-full bg-zinc-800/50 hover:bg-zinc-800 p-3 rounded-xl cursor-pointer transition-colors border border-zinc-700/50"
            >
              <p className="text-white font-mono text-xs break-all mr-3 line-clamp-1">
                {address}
              </p>
              <div className="bg-zinc-700/50 p-2 rounded-lg text-zinc-300">
                <Copy size={14} />
              </div>
            </div>
          </div>

          {/* История */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">История {currency}</h3>
              <History size={18} className="text-zinc-500" />
            </div>
            
            {history.length > 0 ? (
              <div className="flex flex-col gap-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-2xl border border-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        {item.type === 'receive' ? (
                          <ArrowDownLeft size={18} className="text-green-400" />
                        ) : (
                          <ArrowUpRight size={18} className="text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.type === 'receive' ? 'Получено' : 'Отправлено'}
                        </p>
                        <p className="text-xs text-zinc-500">{formatDate(item.timestamp)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${item.type === 'receive' ? 'text-green-400' : 'text-white'}`}>
                      {item.type === 'receive' ? '+' : '-'}{item.amount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-4 bg-zinc-900/20 rounded-2xl border border-zinc-800/20">
                {isLoading ? "Загрузка истории..." : "Здесь будут отображаться переводы"}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
