import type { OrderBookEntry } from '../types';

export const MOCK_ASKS: OrderBookEntry[] = [
  { price: 78160.6, quantity: 0.0067 },
  { price: 78160.5, quantity: 0.0038 },
  { price: 78160.4, quantity: 0.0038 },
  { price: 78160.3, quantity: 0.0001 },
  { price: 78160.1, quantity: 0.0001 },
  { price: 78160.0, quantity: 8.8461 },
];

export const MOCK_BIDS: OrderBookEntry[] = [
  { price: 78159.9, quantity: 10.1429 },
  { price: 78159.8, quantity: 0.6070 },
  { price: 78159.5, quantity: 0.0003 },
  { price: 78159.0, quantity: 0.0304 },
  { price: 78158.6, quantity: 3.0717 },
  { price: 78158.5, quantity: 0.0001 },
];

export const MOCK_CURRENT_PRICE = 78159.9;
export const MOCK_MARK_PRICE = 78158.4;

export const MOCK_FUNDING_RATE = -0.0067;
export const MOCK_FUNDING_COUNTDOWN = '03:44:04';
