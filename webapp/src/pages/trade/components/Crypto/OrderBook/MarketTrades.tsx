import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../../../../i18n';
import { useMarketTradesData } from '../hooks/useMarketTradesData';

export const MarketTrades = memo(() => {
  const { t } = useTranslation();
  const { trades } = useMarketTradesData();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pl-1 text-xs font-mono select-none">
      <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
        <span className="text-zinc-500 font-sans flex-1 text-left">{t('trade.price')}</span>
        <span className="text-zinc-500 font-sans flex-1 text-right">{t('trade.amount')}</span>
        <span className="text-zinc-500 font-sans flex-1 text-right">{t('trade.time')}</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-1">
        <div className="flex flex-col gap-[2px]">
          <AnimatePresence initial={false}>
            {trades.map((trade) => (
              <motion.div 
                key={trade.id} 
                initial={trade.isNew ? { height: 0, opacity: 0, backgroundColor: trade.direction === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' } : false}
                animate={{ height: 15, opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-2 overflow-hidden leading-none"
              >
                <span className={`flex-1 text-left ${trade.direction === 'buy' ? 'text-bitget-green' : 'text-bitget-red'}`}>
                  {trade.price}
                </span>
                <span className="flex-1 text-right text-zinc-300">
                  {trade.amount}
                </span>
                <span className="flex-1 text-right text-zinc-500">
                  {trade.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
