import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, History, Copy, QrCode } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import { fetchBalances, fetchHistory, TransactionEvent } from '../../../utils/tonapi';

interface DashboardProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
}

export const Dashboard = ({ onSendClick, onReceiveClick }: DashboardProps) => {
  const { address, balanceTON, balanceUSDT, setBalances } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<TransactionEvent[]>([]);

  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "UQ...----";
  const currentTonPrice = 6.5; 
  const totalBalanceUsd = (parseFloat(balanceUSDT) + parseFloat(balanceTON) * currentTonPrice).toFixed(2);

  useEffect(() => {
    const loadData = async () => {
      if (!address) return;
      setIsLoading(true);
      
      const [newBalances, newHistory] = await Promise.all([
        fetchBalances(address),
        fetchHistory(address)
      ]);
      
      setBalances(newBalances.ton, newBalances.usdt);
      setHistory(newHistory);
      setIsLoading(false);
    };

    loadData();
  }, [address, setBalances]);

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10"
    >
      <div className="flex flex-col items-center justify-center mt-4">
        <div onClick={handleCopy} className="flex items-center gap-2 bg-zinc-900/80 rounded-full px-4 py-1.5 border border-zinc-800 mb-6 cursor-pointer hover:bg-zinc-800 transition-colors">
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-xs font-mono text-zinc-400">{shortAddress}</span>
          <Copy size={12} className="text-zinc-500" />
        </div>

        <span className="text-zinc-500 text-sm font-medium mb-1">Общий баланс</span>
        <h1 className="text-5xl font-bold tracking-tight text-white flex items-start gap-1">
          <span className="text-3xl mt-1 text-zinc-400">$</span>
          {isLoading && parseFloat(totalBalanceUsd) === 0 ? "..." : totalBalanceUsd}
        </h1>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <button onClick={onReceiveClick} className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
            <ArrowDownLeft size={24} />
          </div>
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Получить</span>
        </button>
        <button onClick={onSendClick} className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-100 flex items-center justify-center border border-zinc-800 group-hover:bg-zinc-800 transition-all">
            <ArrowUpRight size={24} />
          </div>
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Отправить</span>
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white mb-4">Активы</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white font-bold text-sm">₮</span>
              </div>
              <div>
                <p className="text-white font-medium">Tether</p>
                <p className="text-xs text-zinc-500">USDT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{isLoading ? "..." : balanceUSDT}</p>
              <p className="text-xs text-zinc-500">${isLoading ? "..." : balanceUSDT}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0098EA] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Toncoin</p>
                <p className="text-xs text-zinc-500">TON (Gas)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{isLoading ? "..." : balanceTON}</p>
              <p className="text-xs text-zinc-500">~${isLoading ? "..." : (parseFloat(balanceTON) * currentTonPrice).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">История</h3>
          <History size={18} className="text-zinc-500" />
        </div>
        
        {history.length > 0 ? (
          <div className="flex flex-col gap-4">
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
                      {item.type === 'receive' ? 'Получено' : 'Отправлено'} {item.currency}
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
          <p className="text-zinc-500 text-sm text-center py-4">
            {isLoading ? "Загрузка истории..." : "Здесь будут отображаться ваши переводы"}
          </p>
        )}
      </div>

      {/* Кнопка сброса (только для тестов) */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => {
            if (confirm("Вы уверены, что хотите удалить кошелек с устройства? Без сид-фразы вы потеряете к нему доступ навсегда.")) {
              useWalletStore.getState().clearWallet();
              window.location.reload();
            }
          }}
          className="text-xs text-red-500/50 hover:text-red-500 transition-colors"
        >
          Сбросить кошелек (для тестов)
        </button>
      </div>
    </motion.div>
  );
};
