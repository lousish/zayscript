import { useEffect, useState } from 'react';
import { CRYPTO_PAIRS, formatCurrency, formatPercent } from '@/lib/cryptoData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PriceTicker() {
  const [prices, setPrices] = useState(CRYPTO_PAIRS);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev =>
        prev.map(pair => {
          const volatility = pair.price * 0.002;
          const change = (Math.random() - 0.48) * volatility;
          const newPrice = Math.max(0.0001, pair.price + change);
          const newChange = pair.change24h + (change / pair.price) * 100;
          return { ...pair, price: newPrice, change24h: newChange };
        }),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...prices, ...prices];

  return (
    <div className="bg-surface/80 border-y border-border overflow-hidden py-2.5 backdrop-blur-sm">
      <div className="flex ticker-scroll whitespace-nowrap">
        {doubled.map((pair, i) => (
          <div key={i} className="ticker mx-2 shrink-0">
            <span className="text-slate-400 font-semibold">{pair.symbol}</span>
            <span className="text-slate-100 font-semibold">{formatCurrency(pair.price)}</span>
            <span className={pair.change24h >= 0 ? 'text-emerald-400 flex items-center gap-0.5' : 'text-red-400 flex items-center gap-0.5'}>
              {pair.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPercent(pair.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
