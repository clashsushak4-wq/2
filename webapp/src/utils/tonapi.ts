import { Address } from '@ton/core';

// Используем публичный эндпоинт TonAPI
// В будущем для продакшена желательно получить свой ключ на tonconsole.com
const BASE_URL = 'https://tonapi.io/v2';
const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT on TON
const usdtMasterAddress = Address.parse(USDT_MASTER);

export interface Balances {
  ton: string;
  usdt: string;
  price: number;
}

// Вспомогательная функция для native fetch, так как axios может нестабильно работать в WebView TMA
async function fetchApi(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Fetch API Error for ${url}:`, err);
    throw err;
  }
}

/**
 * Получает баланс GRAM и USDT для указанного адреса, а также текущую цену TON.
 * Возвращает строковые значения, отформатированные для отображения.
 */
export async function fetchBalances(address: string): Promise<Balances> {
  if (!address) return { ton: "0.0", usdt: "0.0", price: 1.58 };

  let tonBalance = "0.00";
  let usdtBalance = "0.00";
  let currentPrice = 1.58;

  try {
    // 1. Получаем GRAM баланс
    const accountData = await fetchApi(`${BASE_URL}/accounts/${address}`);
    const tonBalanceNano = accountData.balance || 0;
    tonBalance = (tonBalanceNano / 1e9).toFixed(2);
  } catch (error) {
    console.error("Failed to fetch TON balance:", error);
  }

  try {
    // 2. Получаем цену TON в USD через TonAPI
    const ratesData = await fetchApi(`${BASE_URL}/rates?tokens=ton&currencies=usd`);
    const rates = ratesData?.rates;
    if (rates) {
      currentPrice = rates.TON?.prices?.USD || rates.ton?.prices?.USD || rates.toncoin?.prices?.USD || currentPrice;
    }
  } catch (error) {
    console.error("Failed to fetch TON price:", error);
  }

  try {
    // 3. Получаем балансы всех Jettons (ищем USDT)
    const jettonsData = await fetchApi(`${BASE_URL}/accounts/${address}/jettons`);
    const jettons = jettonsData.balances || [];
    
    const usdtJetton = jettons.find((j: any) => {
      try {
        return Address.parse(j.jetton.address).equals(usdtMasterAddress);
      } catch (e) {
        return false;
      }
    });
    
    if (usdtJetton) {
      // У USDT decimals = 6
      usdtBalance = (usdtJetton.balance / 1e6).toFixed(2);
    }
  } catch (error) {
    console.error("Failed to fetch Jettons (maybe rate limited):", error);
  }

  return { ton: tonBalance, usdt: usdtBalance, price: currentPrice };
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
    const data = await fetchApi(`${BASE_URL}/accounts/${address}/events?limit=20`);
    const events = data.events || [];

    const history: TransactionEvent[] = [];
    let myAddressParsed: Address | null = null;
    
    try {
      myAddressParsed = Address.parse(address);
    } catch (e) {
      console.error("Invalid local address format", e);
    }

    events.forEach((event: any) => {
      event.actions.forEach((action: any) => {
        if (action.type === 'TonTransfer') {
          let isSender = false;
          try {
            if (myAddressParsed && action.TonTransfer?.sender?.address) {
              const senderAddr = Address.parse(action.TonTransfer.sender.address);
              isSender = senderAddr.equals(myAddressParsed);
            } else {
               isSender = action.TonTransfer?.sender?.address === address;
            }
          } catch(e) {
            isSender = action.TonTransfer?.sender?.address === address;
          }

          history.push({
            id: event.event_id,
            type: isSender ? 'send' : 'receive',
            amount: (action.TonTransfer?.amount / 1e9).toFixed(2),
            currency: 'GRAM',
            timestamp: event.timestamp
          });
        } else if (action.type === 'JettonTransfer') {
          try {
            if (Address.parse(action.JettonTransfer?.jetton?.address).equals(usdtMasterAddress)) {
              let isSender = false;
              try {
                if (myAddressParsed && action.JettonTransfer?.sender?.address) {
                  const senderAddr = Address.parse(action.JettonTransfer.sender.address);
                  isSender = senderAddr.equals(myAddressParsed);
                }
              } catch(e) {
                isSender = action.JettonTransfer?.sender?.address === address;
              }
              
              history.push({
                id: event.event_id,
                type: isSender ? 'send' : 'receive',
                amount: (action.JettonTransfer?.amount / 1e6).toFixed(2),
                currency: 'USDT',
                timestamp: event.timestamp
              });
            }
          } catch (e) {
            // Ignored, bad address
          }
        }
      });
    });

    return history;
  } catch (error) {
    console.error("Failed to fetch history:", error);
    throw error;
  }
}
