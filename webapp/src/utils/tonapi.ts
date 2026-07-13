import axios from 'axios';

// Используем публичный эндпоинт TonAPI
// В будущем для продакшена желательно получить свой ключ на tonconsole.com
const BASE_URL = 'https://tonapi.io/v2';
const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT on TON

export interface Balances {
  ton: string;
  usdt: string;
}

/**
 * Получает баланс GRAM и USDT для указанного адреса.
 * Возвращает строковые значения, отформатированные для отображения.
 */
export async function fetchBalances(address: string): Promise<Balances> {
  if (!address) return { ton: "0.0", usdt: "0.0" };

  try {
    // 1. Получаем GRAM баланс
    const accountRes = await axios.get(`${BASE_URL}/accounts/${address}`);
    const tonBalanceNano = accountRes.data.balance || 0;
    const tonBalance = (tonBalanceNano / 1e9).toFixed(2);

    // 2. Получаем балансы всех Jettons (ищем USDT)
    const jettonsRes = await axios.get(`${BASE_URL}/accounts/${address}/jettons`);
    const jettons = jettonsRes.data.balances || [];
    
    let usdtBalance = "0.00";
    const usdtJetton = jettons.find((j: any) => j.jetton.address === USDT_MASTER);
    
    if (usdtJetton) {
      // У USDT decimals = 6
      usdtBalance = (usdtJetton.balance / 1e6).toFixed(2);
    }

    return { ton: tonBalance, usdt: usdtBalance };
  } catch (error) {
    console.error("Failed to fetch balances:", error);
    return { ton: "0.0", usdt: "0.0" };
  }
}

export interface TransactionEvent {
  id: string;
  type: 'receive' | 'send';
  amount: string;
  currency: 'GRAM' | 'USDT';
  timestamp: number;
}

/**
 * Получает историю переводов (events) для адреса.
 */
export async function fetchHistory(address: string): Promise<TransactionEvent[]> {
  if (!address) return [];

  try {
    // Получаем последние 20 событий
    const res = await axios.get(`${BASE_URL}/accounts/${address}/events?limit=20`);
    const events = res.data.events || [];

    const history: TransactionEvent[] = [];

    events.forEach((event: any) => {
      event.actions.forEach((action: any) => {
        if (action.type === 'TonTransfer') {
          const isSender = action.TonTransfer?.sender?.address === address;
          history.push({
            id: event.event_id,
            type: isSender ? 'send' : 'receive',
            amount: (action.TonTransfer?.amount / 1e9).toFixed(2),
            currency: 'GRAM',
            timestamp: event.timestamp
          });
        } else if (action.type === 'JettonTransfer') {
          if (action.JettonTransfer?.jetton?.address === USDT_MASTER) {
            const isSender = action.JettonTransfer?.sender?.address === address;
            history.push({
              id: event.event_id,
              type: isSender ? 'send' : 'receive',
              amount: (action.JettonTransfer?.amount / 1e6).toFixed(2),
              currency: 'USDT',
              timestamp: event.timestamp
            });
          }
        }
      });
    });

    return history;
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
}
