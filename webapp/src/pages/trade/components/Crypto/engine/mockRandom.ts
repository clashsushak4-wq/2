const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const mockRandom = (symbol: string, tick: number, channel = 0): number => {
  let value = (hashString(symbol) + Math.imul(tick + 1, 374761393) + Math.imul(channel + 1, 668265263)) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
};

