import test from 'node:test';
import assert from 'node:assert/strict';
import { useCryptoStore } from '../src/pages/trade/components/Crypto/store/useCryptoStore.ts';

test.beforeEach(() => {
  useCryptoStore.setState({
    price: '0.01312',
    leverage: 3,
    isBatchLeverage: false,
    side: 'buy',
    orderType: 'limit',
    unit: 'value_usdt',
    activeTab: 'orders',
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
  useCryptoStore.getState().setUnit('qty_btc');
  useCryptoStore.getState().setActiveTab('positions');

  const state = useCryptoStore.getState();
  assert.equal(state.side, 'sell');
  assert.equal(state.orderType, 'market');
  assert.equal(state.unit, 'qty_btc');
  assert.equal(state.activeTab, 'positions');
});
