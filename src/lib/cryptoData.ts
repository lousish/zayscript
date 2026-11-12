import type { CryptoPair } from './supabase';

export const CRYPTO_PAIRS: CryptoPair[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 96542.32, change24h: 2.34, icon: '₿', color: '#F7931A' },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3421.87, change24h: 3.12, icon: 'Ξ', color: '#627EEA' },
  { symbol: 'BNB/USDT', name: 'BNB', price: 678.45, change24h: 1.87, icon: 'B', color: '#F3BA2F' },
  { symbol: 'SOL/USDT', name: 'Solana', price: 234.56, change24h: 5.43, icon: 'S', color: '#14F195' },
  { symbol: 'XRP/USDT', name: 'Ripple', price: 1.34, change24h: -1.23, icon: 'X', color: '#23292F' },
  { symbol: 'ADA/USDT', name: 'Cardano', price: 0.87, change24h: 4.21, icon: 'A', color: '#0033AD' },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', price: 0.3456, change24h: 7.89, icon: 'D', color: '#C2A633' },
  { symbol: 'AVAX/USDT', name: 'Avalanche', price: 45.67, change24h: 2.98, icon: 'V', color: '#E84142' },
  { symbol: 'DOT/USDT', name: 'Polkadot', price: 8.92, change24h: -0.54, icon: 'P', color: '#E6007A' },
  { symbol: 'LINK/USDT', name: 'Chainlink', price: 23.45, change24h: 6.12, icon: 'L', color: '#2A5ADA' },
  { symbol: 'MATIC/USDT', name: 'Polygon', price: 0.5423, change24h: 3.45, icon: 'M', color: '#8247E5' },
  { symbol: 'LTC/USDT', name: 'Litecoin', price: 102.34, change24h: 1.56, icon: 'Ł', color: '#BFBBBB' },
];

export function generatePriceHistory(basePrice: number, points = 60): number[] {
  const history: number[] = [];
  let price = basePrice * 0.97;
  for (let i = 0; i < points; i++) {
    const volatility = basePrice * 0.003;
    const drift = (basePrice - price) * 0.02;
    price += drift + (Math.random() - 0.5) * volatility;
    history.push(price);
  }
  history[history.length - 1] = basePrice;
  return history;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCrypto(amount: number): string {
  if (amount >= 1) return amount.toFixed(4);
  return amount.toFixed(6);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
