import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_INSTRUMENT, toInstrumentSpec } from '../src/pages/trade/components/Crypto/data/mockInstruments.ts';
import {
  amountValueFromQuantity,
  calculateOrderEstimate,
  roundToStep,
} from '../src/pages/trade/components/Crypto/domain/orderCalculations.ts';
import {
  calculateTriggerPrice,
  isValidTriggerPrice,
} from '../src/pages/trade/components/Crypto/domain/tpslCalculations.ts';
import { mockRandom } from '../src/pages/trade/components/Crypto/engine/mockRandom.ts';
import { generateMockChartData } from '../src/pages/trade/components/Crypto/Chart/data/chartGenerator.ts';
import { calculateCloseQuantityByPercent } from '../src/pages/trade/components/Crypto/domain/positionCalculations.ts';

const spec = toInstrumentSpec(DEFAULT_INSTRUMENT);

test('100 percent order size reserves margin and fee inside available balance', () => {
  const availableBalance = 5_300;
  const maxNotional = availableBalance / ((1 / 3) + spec.takerFeeRate);
  const quantity = roundToStep(maxNotional / DEFAULT_INSTRUMENT.price, spec.quantityStep, 'floor');
  const inputValue = amountValueFromQuantity('value_quote', quantity, DEFAULT_INSTRUMENT.price, 3);
  const estimate = calculateOrderEstimate({
    unit: 'value_quote',
    inputValue,
    price: DEFAULT_INSTRUMENT.price,
    leverage: 3,
    availableBalance,
    orderType: 'market',
    spec,
  });

  assert.ok(estimate.quantity > 0);
  assert.ok(estimate.totalRequired <= availableBalance);
  assert.ok(estimate.percent <= 100);
});

test('base, cost and value units resolve to the same quantity', () => {
  const quantity = 0.03;
  const common = {
    price: DEFAULT_INSTRUMENT.price,
    leverage: 5,
    availableBalance: 5_300,
    orderType: 'limit' as const,
    spec,
  };

  const estimates = (['qty_base', 'cost_quote', 'value_quote'] as const).map((unit) => (
    calculateOrderEstimate({
      ...common,
      unit,
      inputValue: amountValueFromQuantity(unit, quantity, common.price, common.leverage),
    })
  ));

  for (const estimate of estimates) assert.equal(estimate.quantity, quantity);
});

test('close estimate uses position quantity instead of available balance', () => {
  const estimate = calculateOrderEstimate({
    intent: 'close',
    unit: 'qty_base',
    inputValue: 0.025,
    price: DEFAULT_INSTRUMENT.price,
    leverage: 5,
    availableBalance: 0,
    orderType: 'market',
    maxCloseQuantity: 0.025,
    spec,
  });

  assert.equal(estimate.quantity, 0.025);
  assert.equal(estimate.maxQuantity, 0.025);
  assert.equal(estimate.requiredMargin, 0);
  assert.equal(estimate.percent, 100);
});

test('TP and SL conversion respects long and short direction', () => {
  const longTp = calculateTriggerPrice({
    mode: 'change',
    value: 5,
    kind: 'tp',
    direction: 'long',
    entryPrice: 100,
    leverage: 10,
    quantity: 1,
  });
  const shortSl = calculateTriggerPrice({
    mode: 'roi',
    value: 20,
    kind: 'sl',
    direction: 'short',
    entryPrice: 100,
    leverage: 10,
    quantity: 1,
  });

  assert.equal(longTp, 105);
  assert.equal(shortSl, 102);
  assert.equal(isValidTriggerPrice('tp', 'long', longTp, 100), true);
  assert.equal(isValidTriggerPrice('sl', 'short', shortSl, 100), true);
  assert.equal(isValidTriggerPrice('tp', 'long', 95, 100), false);
});

test('mock market random stream is deterministic by symbol, tick and channel', () => {
  const first = mockRandom('BTCUSDT', 42, 3);
  assert.equal(mockRandom('BTCUSDT', 42, 3), first);
  assert.notEqual(mockRandom('BTCUSDT', 43, 3), first);
  assert.notEqual(mockRandom('ETHUSDT', 42, 3), first);
});

test('mock chart respects the selected timeframe', () => {
  const minute = generateMockChartData('BTCUSDT', 100, 1, '1m', 3);
  const hour = generateMockChartData('BTCUSDT', 100, 1, '1h', 3);
  const minuteStep = Number(minute.candles[1].time) - Number(minute.candles[0].time);
  const hourStep = Number(hour.candles[1].time) - Number(hour.candles[0].time);

  assert.equal(minuteStep, 60);
  assert.equal(hourStep, 3_600);
});

test('partial close quantity respects the instrument step', () => {
  assert.equal(calculateCloseQuantityByPercent(0.02, 25, 0.001), 0.005);
  assert.equal(calculateCloseQuantityByPercent(0.001, 25, 0.001), 0);
  assert.equal(calculateCloseQuantityByPercent(0.001, 100, 0.001), 0.001);
});
