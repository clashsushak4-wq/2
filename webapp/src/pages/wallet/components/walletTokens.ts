export interface WalletToken {
  id: string;
  symbol: string;
  abbr: string;
  name: string;
  color: string;
  decimals: number;
  network: string;
  note?: string;
}

export const WALLET_TOKENS: WalletToken[] = [
  { id: 'ton',   symbol: 'TON',   abbr: 'TON',  name: 'Toncoin',    color: '#0098EA', decimals: 2, network: 'TON' },
  { id: 'usdt',  symbol: 'USDT',  abbr: 'USDT', name: 'Tether USD',  color: '#26A17B', decimals: 2, network: 'TON' },
  { id: 'usdc',  symbol: 'USDC',  abbr: 'USDC', name: 'USD Coin',    color: '#2775CA', decimals: 2, network: 'TON' },
  { id: 'btc',   symbol: 'BTC',   abbr: 'BTC',  name: 'Bitcoin',     color: '#F7931A', decimals: 8, network: 'TON', note: 'Wrapped' },
  { id: 'eth',   symbol: 'ETH',   abbr: 'ETH',  name: 'Ethereum',    color: '#627EEA', decimals: 6, network: 'TON', note: 'Wrapped' },
  { id: 'not',   symbol: 'NOT',   abbr: 'NOT',  name: 'Notcoin',     color: '#E7B230', decimals: 2, network: 'TON' },
  { id: 'dogs',  symbol: 'DOGS',  abbr: 'DOGS', name: 'Dogs',        color: '#8B5CF6', decimals: 2, network: 'TON' },
  { id: 'hmstr', symbol: 'HMSTR', abbr: 'HMS',  name: 'Hamster',     color: '#FF6B35', decimals: 2, network: 'TON' },
];
