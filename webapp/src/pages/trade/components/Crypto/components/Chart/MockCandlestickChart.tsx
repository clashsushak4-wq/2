import { Maximize2 } from 'lucide-react';
import { MOCK_CANDLES } from './data/mockChartData';

const WIDTH = 360;
const HEIGHT = 340;
const VOLUME_HEIGHT = 78;
const PRICE_HEIGHT = HEIGHT - VOLUME_HEIGHT;
const PADDING_X = 8;
const RIGHT_LABEL_WIDTH = 48;

export const MockCandlestickChart = () => {
  const maxPrice = Math.max(...MOCK_CANDLES.map((candle) => candle.high));
  const minPrice = Math.min(...MOCK_CANDLES.map((candle) => candle.low));
  const maxVolume = Math.max(...MOCK_CANDLES.map((candle) => candle.volume));
  const chartWidth = WIDTH - PADDING_X * 2 - RIGHT_LABEL_WIDTH;
  const candleGap = chartWidth / MOCK_CANDLES.length;
  const candleWidth = Math.max(5, candleGap * 0.52);
  const scaleY = (price: number) =>
    16 + ((maxPrice - price) / (maxPrice - minPrice)) * (PRICE_HEIGHT - 34);
  const scaleVolume = (volume: number) => (volume / maxVolume) * (VOLUME_HEIGHT - 18);
  const currentPrice = 2342.46;
  const currentY = scaleY(currentPrice);
  const gridY = [20, 96, 172, 248];
  const gridX = [84, 176, 268];

  return (
    <div className="relative h-[380px] border-b border-zinc-900 bg-black overflow-hidden">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full" preserveAspectRatio="none">
        {gridY.map((y) => (
          <line key={`gy-${y}`} x1="0" x2={WIDTH} y1={y} y2={y} stroke="#18181b" strokeWidth="1" />
        ))}
        {gridX.map((x) => (
          <line key={`gx-${x}`} x1={x} x2={x} y1="0" y2={HEIGHT} stroke="#18181b" strokeWidth="1" />
        ))}

        <line
          x1="0"
          x2={WIDTH - 18}
          y1={currentY}
          y2={currentY}
          stroke="#a1a1aa"
          strokeWidth="0.7"
          strokeDasharray="2 2"
          opacity="0.85"
        />

        {MOCK_CANDLES.map((candle, index) => {
          const x = PADDING_X + index * candleGap + candleGap / 2;
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const isUp = candle.close >= candle.open;
          const color = isUp ? '#ffffff' : '#a78bfa';
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(openY - closeY), 3);
          const volumeHeight = scaleVolume(candle.volume);
          const volumeY = HEIGHT - volumeHeight - 8;

          return (
            <g key={`candle-${candle.time}`}>
              <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="1.2" />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx="0.6"
                fill={color}
              />
              <rect
                x={x - candleWidth / 2}
                y={volumeY}
                width={candleWidth}
                height={volumeHeight}
                fill={color}
                opacity="0.9"
              />
            </g>
          );
        })}

        <text x="16" y="34" fill="#f4f4f5" fontSize="10" fontFamily="monospace">3,657.40</text>
        <text x="318" y="28" fill="#52525b" fontSize="10" fontFamily="monospace" textAnchor="end">3,868.16</text>
        <text x="318" y="106" fill="#52525b" fontSize="10" fontFamily="monospace" textAnchor="end">3,400.65</text>
        <text x="318" y="184" fill="#52525b" fontSize="10" fontFamily="monospace" textAnchor="end">2,933.14</text>
        <text x="318" y="260" fill="#52525b" fontSize="10" fontFamily="monospace" textAnchor="end">1,998</text>
        <text x="318" y="304" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="end">1,741.37</text>
        <text x="4" y="318" fill="#a78bfa" fontSize="10" fontFamily="monospace">VOL,548.13тыс</text>
        <text x="328" y="318" fill="#52525b" fontSize="10" fontFamily="monospace" textAnchor="end">2.77M</text>
        <text x="42" y="314" fill="#27272a" fontSize="18" fontWeight="700">BingX</text>
        <text x="8" y="338" fill="#52525b" fontSize="10">18:00</text>
        <text x="154" y="338" fill="#52525b" fontSize="10">22.12 18:00</text>
        <text x="270" y="338" fill="#52525b" fontSize="10">15.01 18:00</text>
      </svg>

      <div
        className="absolute right-1 flex items-center gap-1 rounded border border-white bg-black px-1.5 py-0.5 text-[10px] font-mono text-white"
        style={{ top: currentY - 11 }}
      >
        2,342.46
        <span className="text-zinc-400">›</span>
      </div>

      <button className="absolute bottom-[88px] left-4 text-white">
        <Maximize2 size={17} />
      </button>
    </div>
  );
};
