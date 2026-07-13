import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Onboarding, Dashboard, PinPad, SeedBackup, SeedImport, SendForm, ReceiveSheet, SettingsScreen, TokenDetailScreen } from './components';
import { BottomSheet } from '../../shared/ui';
import { useWalletStore } from '../../store/walletStore';
import { generateNewWallet, encryptMnemonic, decryptMnemonic } from '../../utils/crypto';
import { useBinanceTicker } from '../../hooks/useBinanceMarket';
import { sendTransaction } from '../../utils/transactions';

type WalletStep = 'onboarding' | 'import_seed' | 'generating' | 'backup' | 'pin_setup' | 'pin_confirm' | 'dashboard' | 'send_form' | 'send_pin' | 'sending' | 'receive_sheet' | 'settings_sheet' | 'token_detail_sheet';

export const WalletView = () => {
  const { hasWallet, address, encryptedMnemonic, balanceGRAM, balanceUSDT, setWallet } = useWalletStore();
  
  const [step, setStep] = useState<WalletStep>(hasWallet ? 'dashboard' : 'onboarding');

  // Слушаем асинхронную загрузку из Telegram CloudStorage
  useEffect(() => {
    if (hasWallet && step === 'onboarding') {
      setStep('dashboard');
    }
  }, [hasWallet, step]);
  
  // States for creation
  const [tempMnemonic, setTempMnemonic] = useState<string[]>([]);
  const [tempAddress, setTempAddress] = useState<string>('');
  const [tempPin, setTempPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // States for sending & viewing
  const [sendData, setSendData] = useState<{address: string, amount: string, currency: 'GRAM' | 'USDT'} | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<'GRAM' | 'USDT'>('GRAM');

  // Live TON price
  const tonTicker = useBinanceTicker('GRAMUSDT');
  const currentTonPrice = tonTicker ? parseFloat(tonTicker.lastPrice) : 1.58;

  const handleCreateNew = async () => {
    setStep('generating');
    try {
      await new Promise(r => setTimeout(r, 500)); 
      const walletData = await generateNewWallet();
      setTempMnemonic(walletData.mnemonic);
      setTempAddress(walletData.address);
      setStep('backup');
    } catch (e) {
      console.error("Failed to generate wallet", e);
      setStep('onboarding');
    }
  };

  const handleImportSuccess = (mnemonic: string[], address: string) => {
    setTempMnemonic(mnemonic);
    setTempAddress(address);
    setStep('pin_setup'); // Переходим к созданию PIN-кода для импортированного кошелька
  };

  const handlePinSetup = (pin: string) => {
    setTempPin(pin);
    setPinError('');
    setStep('pin_confirm');
  };

  const handlePinConfirm = async (pin: string) => {
    if (pin !== tempPin) {
      setPinError('PIN-коды не совпадают. Попробуйте еще раз.');
      setStep('pin_setup');
      setTempPin('');
      return;
    }

    try {
      const mnemonicStr = tempMnemonic.join(' ');
      const encrypted = await encryptMnemonic(mnemonicStr, pin);
      setWallet(tempAddress, encrypted);
      setTempMnemonic([]);
      setTempPin('');
      setStep('dashboard');
    } catch (e) {
      console.error("Failed to encrypt wallet", e);
      setPinError('Ошибка шифрования. Повторите.');
      setStep('pin_setup');
    }
  };

  const handleSendInit = (address: string, amount: string, currency: 'GRAM' | 'USDT') => {
    setSendData({ address, amount, currency });
    setPinError('');
    setStep('send_pin');
  };

  const handleSendConfirm = async (pin: string) => {
    if (!encryptedMnemonic || !sendData) return;

    setStep('sending');
    try {
      // 1. Расшифровываем сид-фразу
      const mnemonicStr = await decryptMnemonic(encryptedMnemonic, pin);
      
      // 2. Отправляем транзакцию
      await sendTransaction(mnemonicStr, sendData.address, sendData.amount, sendData.currency);
      
      // 3. Успех
      alert('Транзакция успешно отправлена в сеть!');
      setSendData(null);
      setStep('dashboard');
    } catch (e) {
      console.error("Transaction failed", e);
      setPinError('Ошибка отправки. Проверьте PIN-код или баланс.');
      setStep('send_pin');
    }
  };

  const handleAssetClick = (currency: 'GRAM' | 'USDT') => {
    setSelectedAsset(currency);
    setStep('token_detail_sheet');
  };

  return (
    <div className="relative min-h-full">
      <AnimatePresence mode="wait">
        {step === 'onboarding' && (
          <Onboarding key="onboarding" onCreate={handleCreateNew} onImport={() => setStep('import_seed')} />
        )}
        
        {step === 'import_seed' && (
          <SeedImport key="import_seed" onBack={() => setStep('onboarding')} onSuccess={handleImportSuccess} />
        )}
        
        {step === 'generating' && (
          <div key="generating" className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Создаем безопасный кошелек...</p>
            <p className="text-xs text-zinc-600 mt-2">Генерация ключей на устройстве</p>
          </div>
        )}

        {step === 'sending' && (
          <div key="sending" className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Отправляем транзакцию...</p>
            <p className="text-xs text-zinc-600 mt-2">Связываемся с сетью The Open Network</p>
          </div>
        )}

        {step === 'backup' && (
          <SeedBackup key="backup" mnemonic={tempMnemonic} onConfirm={() => setStep('pin_setup')} />
        )}

        {step === 'pin_setup' && (
          <PinPad key="pin_setup" title="Придумайте PIN-код" subtitle="Он потребуется для подтверждения транзакций" onComplete={handlePinSetup} error={pinError} />
        )}

        {step === 'pin_confirm' && (
          <PinPad key="pin_confirm" title="Повторите PIN-код" subtitle="Убедитесь, что вы его запомнили" onComplete={handlePinConfirm} />
        )}

        {['dashboard', 'send_form', 'send_pin', 'receive_sheet', 'sending', 'settings_sheet', 'token_detail_sheet'].includes(step) && (
          <Dashboard 
            key="dashboard" 
            onSendClick={() => setStep('send_form')} 
            onReceiveClick={() => setStep('receive_sheet')}
            onSettingsClick={() => setStep('settings_sheet')}
            onAssetClick={handleAssetClick}
            currentTonPrice={currentTonPrice}
          />
        )}
      </AnimatePresence>

      {/* BOTTOM SHEETS */}
      {/* 1. Receive Sheet */}
      <BottomSheet 
        isOpen={step === 'receive_sheet'} 
        onClose={() => setStep('dashboard')}
        title="Получить средства"
      >
        <ReceiveSheet address={address || ''} />
      </BottomSheet>

      {/* 2. Send Form Sheet */}
      <BottomSheet
        isOpen={step === 'send_form'}
        onClose={() => setStep('dashboard')}
      >
        <SendForm 
          balanceGRAM={balanceGRAM} 
          balanceUSDT={balanceUSDT} 
          onCancel={() => setStep('dashboard')}
          onSend={handleSendInit}
        />
      </BottomSheet>

      {/* 3. Send PIN Confirm Sheet */}
      <BottomSheet
        isOpen={step === 'send_pin'}
        onClose={() => setStep('dashboard')}
      >
        <div className="pt-4">
          <PinPad 
            title="Подтвердите транзакцию" 
            subtitle={`Отправка ${sendData?.amount} ${sendData?.currency} на ${sendData?.address?.slice(0, 6)}...`}
            onComplete={handleSendConfirm} 
            error={pinError}
          />
        </div>
      </BottomSheet>

      {/* 4. Settings Screen */}
      <AnimatePresence>
        {step === 'settings_sheet' && (
          <SettingsScreen key="settings_screen" onClose={() => setStep('dashboard')} />
        )}
      </AnimatePresence>

      {/* 5. Token Detail Screen */}
      <AnimatePresence>
        {step === 'token_detail_sheet' && (
          <TokenDetailScreen 
            key="token_detail_screen"
            currency={selectedAsset}
            balance={selectedAsset === 'GRAM' ? balanceGRAM : balanceUSDT}
            address={address || ''}
            currentPrice={selectedAsset === 'GRAM' ? currentTonPrice : 1}
            onClose={() => setStep('dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
