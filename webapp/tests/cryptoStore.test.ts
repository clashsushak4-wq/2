import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FAVORITE_SYMBOLS } from '../src/pages/trade/components/Crypto/data/mockInstruments.ts';
import { useCryptoStore } from '../src/pages/trade/components/Crypto/store/useCryptoStore.ts';

test.beforeEach(() => {
  useCryptoStore.setState({
    price: '76941.7',
    leverage: 3,
    isBatchLeverage: false,
    side: 'buy',
    orderType: 'limit',
    unit: 'value_quote',
    activeTab: 'orders',
    selectedSymbol: 'BTCUSDT',
    favoriteSymbols: [...DEFAULT_FAVORITE_SYMBOLS],
    isSymbolSelectOpen: false,
  });
});

test('crypto store keeps editable order values', () => {
  useCryptoStore.getState().setPrice('123.45');
  useCryptoStore.getState().setLeverage(25);
  useCryptoStore.getState().setIsBatchLeverage(true);

  const state = useCryptoStore.getState();
  assert.equal(state.price, '123.45');
  assert.equal(state.leverage, 25);
  assert.equal(state.isBatchLeverage, true);
});

test('crypto store keeps tab, side and unit selections', () => {
  useCryptoStore.getState().setSide('sell');
  useCryptoStore.getState().setOrderType('market');
  useCryptoStore.getState().setUnit('qty_base');
  useCryptoStore.getState().setActiveTab('positions');

  const state = useCryptoStore.getState();
  assert.equal(state.side, 'sell');
  assert.equal(state.orderType, 'market');
  assert.equal(state.unit, 'qty_base');
  assert.equal(state.activeTab, 'positions');
});

test('selecting an instrument updates symbol, price and closes the selector', () => {
  useCryptoStore.setState({ isSymbolSelectOpen: true });
  useCryptoStore.getState().setSelectedSymbol('ETHUSDT');

  const state = useCryptoStore.getState();
  assert.equal(state.selectedSymbol, 'ETHUSDT');
  assert.equal(state.price, '2456.64');
  assert.equal(state.isSymbolSelectOpen, false);
});

test('favorite symbols can be added and removed', () => {
  useCryptoStore.getState().toggleFavoriteSymbol('ETHUSDT');
  assert.equal(useCryptoStore.getState().favoriteSymbols.includes('ETHUSDT'), true);

  useCryptoStore.getState().toggleFavoriteSymbol('ETHUSDT');
  assert.equal(useCryptoStore.getState().favoriteSymbols.includes('ETHUSDT'), false);
});
