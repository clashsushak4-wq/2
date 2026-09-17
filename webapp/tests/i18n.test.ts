import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const loadLocale = (language: string) => JSON.parse(
  fs.readFileSync(path.resolve(`src/i18n/locales/${language}.json`), 'utf8'),
);

const collectFiles = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectFiles(entryPath);
  return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
});

test('trade locale keys stay in sync', () => {
  const locales = ['ru', 'en', 'ua'].map(loadLocale);
  const expected = Object.keys(locales[0].trade).sort();

  for (const locale of locales.slice(1)) {
    assert.deepEqual(Object.keys(locale.trade).sort(), expected);
  }
});

test('every trade translation is a non-empty string', () => {
  for (const language of ['ru', 'en', 'ua']) {
    const trade = loadLocale(language).trade as Record<string, unknown>;
    for (const [key, value] of Object.entries(trade)) {
      assert.equal(typeof value, 'string', `${language}.trade.${key} must be a string`);
      assert.ok((value as string).trim(), `${language}.trade.${key} must not be empty`);
    }
  }
});

test('every trade translation key used by the UI exists', () => {
  const trade = loadLocale('en').trade as Record<string, string>;
  const usedKeys = new Set<string>();

  for (const file of collectFiles(path.resolve('src/pages/trade'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/['"]trade\.([A-Za-z0-9]+)['"]/g)) {
      usedKeys.add(match[1]);
    }
  }

  assert.ok(usedKeys.size > 0);
  for (const key of usedKeys) {
    assert.ok(key in trade, `missing trade translation: ${key}`);
  }
});
