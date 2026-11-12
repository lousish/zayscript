import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  balance: number;
  status: 'active' | 'suspended';
  created_at: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  tier: 'beginner' | 'starter' | 'intermediate' | 'advanced' | 'professional' | 'business';
  min_amount: number;
  max_amount: number;
  roi_percentage: number;
  duration_days: number;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  expected_return: number;
  daily_roi: number;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  last_payout: string | null;
  total_earned: number;
  created_at: string;
  plan?: InvestmentPlan;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'roi_payout' | 'trade_profit' | 'trade_loss';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  description: string;
  tx_hash: string | null;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  status: 'open' | 'closed';
  pnl: number;
  created_at: string;
  closed_at: string | null;
};

export type CryptoPair = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  color: string;
};
