/*
# Crypto Investment Platform - Core Schema

## Overview
Creates the complete database schema for a professional crypto investment platform with:
- User profiles (with admin role support)
- Investment plans (Beginner to Business tiers, each with ROI)
- User investments (active investments tracking)
- Transactions (deposits, withdrawals, investment returns)
- Live trades (user trading activity)

## Tables

### profiles
- `id` (uuid, PK, references auth.users)
- `email` (text)
- `full_name` (text)
- `role` (text: 'user' | 'admin', default 'user') — ADMIN-CONTROLLED, not user-editable
- `balance` (numeric, default 0) — ADMIN-CONTROLLED
- `status` (text: 'active' | 'suspended', default 'active') — ADMIN-CONTROLLED
- `created_at` (timestamptz)

### investment_plans
- `id` (uuid, PK)
- `name` (text)
- `tier` (text: 'beginner' | 'starter' | 'intermediate' | 'advanced' | 'professional' | 'business')
- `min_amount` (numeric), `max_amount` (numeric)
- `roi_percentage` (numeric) — daily ROI percentage
- `duration_days` (integer)
- `description` (text), `features` (text[])
- `is_active` (boolean), `sort_order` (integer), `created_at` (timestamptz)

### investments
- `id`, `user_id`, `plan_id`, `amount`, `expected_return`, `daily_roi`
- `status` (active/completed/cancelled), `start_date`, `end_date`, `last_payout`, `total_earned`, `created_at`

### transactions
- `id`, `user_id`, `type`, `amount`, `status`, `description`, `tx_hash`, `created_at`

### trades
- `id`, `user_id`, `pair`, `side`, `amount`, `price`, `total`, `status`, `pnl`, `created_at`, `closed_at`

## Security
- RLS enabled on all tables.
- profiles: users read own profile, update only full_name (column-restricted). role/balance/status managed by admin via service_role.
- investment_plans: public read (anon + authenticated).
- investments, transactions, trades: owner-scoped CRUD for authenticated users.
- Auto-create profile trigger on auth.users insert.

## Notes
1. profiles.role, profiles.balance, profiles.status are NOT directly user-writable.
2. Investment plans seeded with 6 tiers from Beginner to Business.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

GRANT UPDATE (full_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============ INVESTMENT PLANS ============
CREATE TABLE IF NOT EXISTS investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('beginner','starter','intermediate','advanced','professional','business')),
  min_amount numeric NOT NULL,
  max_amount numeric NOT NULL,
  roi_percentage numeric NOT NULL,
  duration_days integer NOT NULL,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON investment_plans TO anon, authenticated;

DROP POLICY IF EXISTS "read_plans_public" ON investment_plans;
CREATE POLICY "read_plans_public"
  ON investment_plans FOR SELECT TO anon, authenticated
  USING (true);

-- ============ INVESTMENTS ============
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES investment_plans(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  expected_return numeric NOT NULL,
  daily_roi numeric NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  last_payout timestamptz,
  total_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON investments TO authenticated;

DROP POLICY IF EXISTS "select_own_investments" ON investments;
CREATE POLICY "select_own_investments"
  ON investments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_investments" ON investments;
CREATE POLICY "insert_own_investments"
  ON investments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_investments" ON investments;
CREATE POLICY "update_own_investments"
  ON investments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_investments" ON investments;
CREATE POLICY "delete_own_investments"
  ON investments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- ============ TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','withdrawal','investment','roi_payout','trade_profit','trade_loss')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','rejected')),
  description text NOT NULL DEFAULT '',
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions"
  ON transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions"
  ON transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions"
  ON transactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ============ TRADES ============
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  pair text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  amount numeric NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  pnl numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON trades TO authenticated;

DROP POLICY IF EXISTS "select_own_trades" ON trades;
CREATE POLICY "select_own_trades"
  ON trades FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trades" ON trades;
CREATE POLICY "insert_own_trades"
  ON trades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trades" ON trades;
CREATE POLICY "update_own_trades"
  ON trades FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trades" ON trades;
CREATE POLICY "delete_own_trades"
  ON trades FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============ SEED INVESTMENT PLANS ============
INSERT INTO investment_plans (name, tier, min_amount, max_amount, roi_percentage, duration_days, description, features, is_active, sort_order) VALUES
('Beginner', 'beginner', 50, 499, 2.5, 7,
 'Perfect for first-time investors looking to explore crypto markets with minimal risk.',
 ARRAY['Daily 2.5% ROI','Capital protection','7-day duration','Email support','Auto-reinvest option'], true, 1),
('Starter', 'starter', 500, 2499, 3.5, 14,
 'Step up your earnings with a higher daily return and longer commitment.',
 ARRAY['Daily 3.5% ROI','Priority support','14-day duration','Weekly performance reports','Flexible withdrawal'], true, 2),
('Intermediate', 'intermediate', 2500, 9999, 5.0, 21,
 'Designed for growing portfolios with balanced risk and strong returns.',
 ARRAY['Daily 5% ROI','Dedicated account manager','21-day duration','Advanced analytics','Early withdrawal option'], true, 3),
('Advanced', 'advanced', 10000, 24999, 7.5, 30,
 'For experienced investors seeking aggressive growth with premium features.',
 ARRAY['Daily 7.5% ROI','VIP support channel','30-day duration','Custom strategy session','Quarterly market review'], true, 4),
('Professional', 'professional', 25000, 99999, 10.0, 45,
 'Institutional-grade returns for high-net-worth individuals and serious traders.',
 ARRAY['Daily 10% ROI','Personal investment advisor','45-day duration','Exclusive market signals','Private community access','Estate planning assistance'], true, 5),
('Business', 'business', 100000, 1000000, 15.0, 60,
 'The ultimate investment tier for businesses and whales — maximum ROI, maximum support.',
 ARRAY['Daily 15% ROI','White-glove concierge service','60-day duration','Custom smart contracts','OTC desk access','Institutional custody','Tax optimization consulting'], true, 6)
ON CONFLICT DO NOTHING;
