import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, ArrowDownLeft, ArrowUpRight, Plus, ArrowLeftRight, ChevronRight, ArrowUpFromLine, HeadphonesIcon } from 'lucide-react';
import { fetchHistory, TransactionEvent } from '../../../utils/tonapi';
import { useBackButton } from '../../../hooks';
import { slideFromRight } from '../../../shared/animations';

interface TokenDetailScreenProps {
  currency: 'GRAM' | 'USDT';
  balance: string;
  address: string;
  currentPrice: number;
  onClose: () => void;
  onReceive: () => void;
  onSend: () => void;
}

export const TokenDetailScreen = ({ currency, balance, address, currentPrice, onClose, onReceive, onSend }: TokenDetailScreenProps) => {
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

  const formatDate = (ts: number) => {
    const date = new Date(ts * 1000);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const balanceUsd = (parseFloat(balance) * currentPrice).toFixed(2);
  const isGram = currency === 'GRAM';
  const themeColor = isGram ? 'from-[#0098EA]/30' : 'from-[#26A17B]/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden md:bg-black/60 md:backdrop-blur-sm bg-black">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 md:relative md:inset-auto md:w-[480px] md:h-[85vh] md:rounded-3xl md:border md:border-zinc-800 md:shadow-2xl flex flex-col overflow-hidden bg-black md:bg-zinc-950"
      >
        {/* Градиентный фон сверху */}
        <div className={`absolute top-0 left-0 right-0 h-96 bg-gradient-to-b ${themeColor} to-transparent pointer-events-none opacity-50`} />

        {/* Header */}
        <div className="relative z-10 px-4 flex items-center justify-between" style={{ paddingTop: 'calc(16px + var(--safe-top, 0px))' }}>
          <div className="w-10" /> {/* Spacer for centering since back button is native */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isGram ? 'bg-[#0098EA]' : 'bg-[#26A17B]'}`}>
              {isGram ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"/>
                </svg>
              ) : (
                <span className="text-white font-bold text-[10px]">₮</span>
              )}
            </div>
            <span className="text-white font-medium">{currency === 'GRAM' ? 'Toncoin' : 'Tether'}</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white">
            <HeadphonesIcon size={22} />
          </button>
        </div>

        {/* Balance */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-8 mb-10 px-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-5xl font-bold text-white tracking-tight">{balance}</h1>
            <span className="text-xl font-medium text-white/80">{currency}</span>
          </div>
          <p className="text-white/60 text-base mt-2">≈ {balanceUsd} $</p>
        </div>

        {/* Actions Row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 px-6 mb-8">
          <button onClick={onReceive} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-black shadow-lg group-hover:scale-105 transition-transform">
              <Plus size={32} strokeWidth={2.5} />
            </div>
            <span className="text-white font-medium text-sm">Получить</span>
          </button>
          <button onClick={() => alert('Обмен в разработке')} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 bg-[#1C1C1E] rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/5">
              <ArrowLeftRight size={28} />
            </div>
            <span className="text-white font-medium text-sm">Обмен</span>
          </button>
          <button onClick={onSend} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 bg-[#1C1C1E] rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/5">
              <ArrowUpRight size={28} />
            </div>
            <span className="text-white font-medium text-sm">Перевод</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4" style={{ paddingBottom: 'calc(80px + var(--safe-bottom, 0px))' }}>
          
          {/* Chart Widget */}
          <div className="bg-[#1C1C1E] rounded-2xl p-4 flex items-center justify-between border border-white/5 relative overflow-hidden group cursor-pointer hover:bg-[#2C2C2E] transition-colors">
            <div>
              <p className="text-white/60 text-xs mb-1">Курс за 1 {currency}</p>
              <p className="text-white text-lg font-bold">{currentPrice.toFixed(4)} $</p>
              <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                ▼ 0.04% <span className="text-white/40 font-normal ml-1">• 24H</span>
              </p>
            </div>
            <ChevronRight size={20} className="text-white/30 group-hover:text-white/70" />
          </div>

          {/* История */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-white">История</h3>
              <button className="text-blue-500 text-sm font-medium">Показать еще</button>
            </div>
            
            <div className="flex flex-col gap-2">
              {isLoading && history.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">Загрузка истории...</p>
              ) : history.length > 0 ? (
                history.map((item) => {
                  const isReceive = item.type === 'receive';
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isReceive ? 'bg-[#26A17B]' : 'bg-[#E5B246]'}`}>
                          {isReceive ? (
                            <ArrowDownLeft size={24} className="text-white" />
                          ) : (
                            <ArrowUpFromLine size={24} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-base font-medium text-white/90">
                            {isReceive ? 'Пополнение' : 'Перевод'}
                          </p>
                          <p className="text-sm text-white/60 mt-0.5">
                            {isReceive ? '+' : '-'}{item.amount} {item.currency}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/40">{formatDate(item.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-white/40 text-sm text-center py-8 bg-[#1C1C1E] rounded-2xl border border-white/5">
                  История переводов пуста
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
