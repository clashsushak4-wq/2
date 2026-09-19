import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrice, normalizeQuantity, isCleanNumber } from '../src/pages/trade/components/Crypto/domain/orderNormalization';
import { DEFAULT_INSTRUMENT, toInstrumentSpec } from '../src/pages/trade/components/Crypto/data/mockInstruments';

const spec = toInstrumentSpec(DEFAULT_INSTRUMENT);

test('normalizePrice handles invalid and weird values gracefully', () => {
  assert.equal(normalizePrice(NaN, spec), 0);
  assert.equal(normalizePrice(Infinity, spec), 0);
  assert.equal(normalizePrice(-100, spec), 0);
  assert.equal(normalizePrice(0, spec), 0);
  // precision and tickSize
  // spec.priceDecimals = 1, tickSize = 0.1 for DEFAULT_INSTRUMENT
  assert.equal(normalizePrice(10.55, spec), 10.6);
  assert.equal(normalizePrice(10.59, spec), 10.6); 
});

test('normalizeQuantity handles invalid and weird values gracefully', () => {
  assert.equal(normalizeQuantity(NaN, spec), 0);
  assert.equal(normalizeQuantity(Infinity, spec), 0);
  assert.equal(normalizeQuantity(-10, spec), 0);
  assert.equal(normalizeQuantity(0, spec), 0);
  // minQuantity = 0.001, quantityStep = 0.001
  assert.equal(normalizeQuantity(0.0055, spec), 0.005);
});

test('isCleanNumber works correctly', () => {
  assert.equal(isCleanNumber(100), true);
  assert.equal(isCleanNumber(0), true);
  assert.equal(isCleanNumber(-100), true);
  assert.equal(isCleanNumber(NaN), false);
  assert.equal(isCleanNumber(Infinity), false);
});
