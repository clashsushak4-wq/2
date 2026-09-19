import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FAVORITE_SYMBOLS } from '../src/pages/trade/components/Crypto/data/mockInstruments.ts';
import { useCryptoStore } from '../src/pages/trade/components/Crypto/store/useCryptoStore.ts';
import {
  getPullProgress,
  getResistedPullDistance,
  MAX_PULL_DISTANCE,
  REFRESH_THRESHOLD,
} from '../src/shared/ui/pullToRefreshMotion.ts';

test.beforeEach(() => {
  useCryptoStore.setState({
    price: '76941.7',
    leverage: 3,
    isBatchLeverage: false,
    orderIntent: 'open',
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

test('crypto store keeps tab, intent and unit selections', () => {
  useCryptoStore.getState().setOrderIntent('close');
  useCryptoStore.getState().setOrderType('market');
  useCryptoStore.getState().setUnit('qty_base');
  useCryptoStore.getState().setActiveTab('positions');

  const state = useCryptoStore.getState();
  assert.equal(state.orderIntent, 'close');
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

test('pull to refresh uses resistance and clamps visual progress', () => {
  assert.equal(getResistedPullDistance(-20), 0);
  assert.ok(getResistedPullDistance(100) >= REFRESH_THRESHOLD);
  assert.ok(getResistedPullDistance(1000) <= MAX_PULL_DISTANCE);
  assert.equal(getPullProgress(0), 0);
  assert.equal(getPullProgress(REFRESH_THRESHOLD), 1);
  assert.equal(getPullProgress(MAX_PULL_DISTANCE), 1);
});
