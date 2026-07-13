import QRCode from 'react-qr-code';
import { Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ReceiveSheetProps {
  address: string;
}

export const ReceiveSheet = ({ address }: ReceiveSheetProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер QR-кода */}
      <div className="bg-white p-4 rounded-3xl mb-6 shadow-xl ring-4 ring-white/10">
        <QRCode 
          value={address} 
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />
      </div>

      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <p className="text-zinc-500 text-xs mb-1 text-center">Ваш адрес в сети TON</p>
        <p className="text-white font-mono text-center text-sm break-all mb-4">
          {address}
        </p>
        
        <button 
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          {copied ? "Скопировано" : "Скопировать адрес"}
        </button>
      </div>

      <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 w-full">
        <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-500/90 leading-relaxed">
          Отправляйте на этот адрес только <b>TON</b> или токены в сети The Open Network (например, <b>USDT TON</b>). Отправка других монет приведет к их безвозвратной потере.
        </p>
      </div>
    </div>
  );
};
