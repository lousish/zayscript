import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type InvestmentPlan, type Investment, type Transaction, type Trade } from '@/lib/supabase';
import { CRYPTO_PAIRS, formatCurrency, formatCrypto, formatPercent, formatDate, formatDateTime, generatePriceHistory } from '@/lib/cryptoData';
import TradingChart from '@/components/TradingChart';
import {
  LayoutDashboard, LineChart, Wallet, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, History, LogOut, Menu, X,
  Bitcoin, Check, Clock, AlertCircle, Plus, Activity, DollarSign,
  ArrowLeftRight, Eye,
} from 'lucide-react';

type Tab = 'overview' | 'trade' | 'invest' | 'wallet' | 'history';

export default function UserDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState(CRYPTO_PAIRS[0]);
  const [chartData, setChartData] = useState<number[]>(generatePriceHistory(CRYPTO_PAIRS[0].price));
  const [livePrices, setLivePrices] = useState(CRYPTO_PAIRS);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const navigate = (r: string) => { window.location.hash = `#/${r}`; };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [plansRes, invRes, txRes, tradeRes] = await Promise.all([
      supabase.from('investment_plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('investments').select('*, plan:investment_plans(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('trades').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ]);
    if (plansRes.data) setPlans(plansRes.data as InvestmentPlan[]);
    if (invRes.data) setInvestments(invRes.data as Investment[]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (tradeRes.data) setTrades(tradeRes.data as Trade[]);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev =>
        prev.map(p => {
          const change = (Math.random() - 0.48) * p.price * 0.003;
          return { ...p, price: Math.max(0.0001, p.price + change) };
        }),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update chart when pair changes
  useEffect(() => {
    setChartData(generatePriceHistory(selectedPair.price));
    const interval = setInterval(() => {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        const lastVal = prev[prev.length - 1];
        const change = (Math.random() - 0.48) * lastVal * 0.004;
        next.push(Math.max(0.0001, lastVal + change));
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const balance = profile?.balance ?? 0;
  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalEarned = investments.reduce((sum, i) => sum + Number(i.total_earned), 0);
  const openTrades = trades.filter(t => t.status === 'open');
  const tradePnl = trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + Number(t.pnl), 0);

  const menuItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trade', label: 'Live Trading', icon: LineChart },
    { id: 'invest', label: 'Investment Plans', icon: TrendingUp },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'history', label: 'History', icon: History },
  ];

  // Trade execution
  const executeTrade = async (side: 'buy' | 'sell', amountUSD: number) => {
    if (!profile) return;
    if (amountUSD <= 0) { showToast('Enter a valid amount', 'error'); return; }
    if (amountUSD > balance) { showToast('Insufficient balance', 'error'); return; }

    const price = selectedPair.price;
    const cryptoAmount = amountUSD / price;

    const { error } = await supabase.from('trades').insert({
      user_id: profile.id,
      pair: selectedPair.symbol,
      side,
      amount: cryptoAmount,
      price,
      total: amountUSD,
      status: 'open',
      pnl: 0,
    });

    if (error) { showToast(error.message, 'error'); return; }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'investment',
      amount: amountUSD,
      status: 'completed',
      description: `${side.toUpperCase()} ${formatCrypto(cryptoAmount)} ${selectedPair.symbol}`,
    });

    showToast(`${side.toUpperCase()} order executed: ${formatCurrency(amountUSD)} ${selectedPair.symbol}`);
    loadData();
    refreshProfile();
  };

  // Close trade
  const closeTrade = async (trade: Trade) => {
    const pairData = livePrices.find(p => p.symbol === trade.pair);
    const currentPrice = pairData?.price ?? trade.price;
    const currentValue = Number(trade.amount) * currentPrice;
    const pnl = trade.side === 'buy' ? currentValue - Number(trade.total) : Number(trade.total) - currentValue;

    const { error } = await supabase.from('trades').update({
      status: 'closed',
      pnl,
      closed_at: new Date().toISOString(),
    }).eq('id', trade.id);

    if (error) { showToast(error.message, 'error'); return; }

    await supabase.from('transactions').insert({
      user_id: profile!.id,
      type: pnl >= 0 ? 'trade_profit' : 'trade_loss',
      amount: Math.abs(pnl),
      status: 'completed',
      description: `Closed ${trade.side.toUpperCase()} ${trade.pair} — PnL: ${formatCurrency(pnl)}`,
    });

    showToast(`Trade closed. PnL: ${formatCurrency(pnl)}`, pnl >= 0 ? 'success' : 'error');
    loadData();
    refreshProfile();
  };

  // Invest in plan
  const investInPlan = async (plan: InvestmentPlan, amount: number) => {
    if (!profile) return;
    if (amount < plan.min_amount) { showToast(`Minimum is ${formatCurrency(plan.min_amount)}`, 'error'); return; }
    if (amount > plan.max_amount) { showToast(`Maximum is ${formatCurrency(plan.max_amount)}`, 'error'); return; }
    if (amount > balance) { showToast('Insufficient balance', 'error'); return; }

    const dailyRoi = (amount * plan.roi_percentage) / 100;
    const expectedReturn = dailyRoi * plan.duration_days;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const { error } = await supabase.from('investments').insert({
      user_id: profile.id,
      plan_id: plan.id,
      amount,
      expected_return: expectedReturn,
      daily_roi: dailyRoi,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) { showToast(error.message, 'error'); return; }

    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'investment',
      amount,
      status: 'completed',
      description: `Invested in ${plan.name} plan — ${plan.roi_percentage}% daily ROI`,
    });

    showToast(`Invested ${formatCurrency(amount)} in ${plan.name} plan!`);
    loadData();
    refreshProfile();
  };

  // Deposit (simulated)
  const makeDeposit = async (amount: number) => {
    if (!profile) return;
    if (amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

    const { error } = await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'deposit',
      amount,
      status: 'completed',
      description: `Deposit via USDT`,
      tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    });

    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Deposit of ${formatCurrency(amount)} successful!`);
    loadData();
    refreshProfile();
  };

  // Withdraw
  const makeWithdrawal = async (amount: number) => {
    if (!profile) return;
    if (amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    if (amount > balance) { showToast('Insufficient balance', 'error'); return; }

    const { error } = await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal request to USDT wallet`,
    });

    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Withdrawal of ${formatCurrency(amount)} requested!`);
    loadData();
  };

  if (profile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Account Suspended</h1>
          <p className="text-slate-400 text-sm mb-6">Your account has been suspended. Please contact support for assistance.</p>
          <button onClick={signOut} className="btn-secondary w-full">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 surface border-r border-border z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center font-bold text-white text-lg">
              C
            </div>
            <span className="font-bold text-lg text-white">Crypto<span className="gradient-text">Vault</span></span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === item.id ? 'bg-sky-600/15 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-surface-2'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className="surface-2 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-500 mb-1">Available Balance</p>
            <p className="text-xl font-bold text-white font-mono">{formatCurrency(balance)}</p>
          </div>
          <button onClick={() => navigate('home')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-2 transition-colors">
            <LayoutDashboard size={18} /> Back to Site
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-2 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-lg border-b border-border h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-300" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-semibold text-white capitalize">{menuItems.find(m => m.id === tab)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 surface-2 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
              <span className="text-xs text-slate-400">Market Live</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center font-semibold text-white text-sm">
                {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{profile?.full_name || 'Investor'}</p>
                <p className="text-xs text-slate-500">{profile?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {toast && (
            <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in-up ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {toast.msg}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Balance', value: formatCurrency(balance), icon: Wallet, color: 'text-sky-400', bg: 'bg-sky-600/10' },
                  { label: 'Active Investments', value: formatCurrency(totalInvested), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
                  { label: 'Total Earned (ROI)', value: formatCurrency(totalEarned), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-600/10' },
                  { label: 'Trade PnL', value: formatCurrency(tradePnl), icon: Activity, color: tradePnl >= 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-cyan-600/10' },
                ].map((stat, i) => (
                  <div key={i} className="card">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color} mb-3`}>
                      <stat.icon size={20} />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-white font-mono">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart + Market */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{selectedPair.symbol}</h3>
                      <p className="text-2xl font-bold text-white font-mono mt-1">{formatCurrency(selectedPair.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">24h Change</p>
                      <p className={`text-sm font-semibold ${selectedPair.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercent(selectedPair.change24h)}
                      </p>
                    </div>
                  </div>
                  <TradingChart data={chartData} color={selectedPair.change24h >= 0 ? '#10b981' : '#ef4444'} height={220} />
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Top Markets</h3>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {livePrices.slice(0, 8).map(pair => (
                      <button
                        key={pair.symbol}
                        onClick={() => { setSelectedPair(pair); setTab('trade'); }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: pair.color }}>
                            {pair.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{pair.symbol}</p>
                            <p className="text-xs text-slate-500">{pair.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-white">{formatCurrency(pair.price)}</p>
                          <p className={`text-xs ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatPercent(pair.change24h)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Investments + Recent Transactions */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Active Investments</h3>
                    <button onClick={() => setTab('invest')} className="text-xs text-sky-400 hover:text-sky-300">View all</button>
                  </div>
                  {activeInvestments.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp size={32} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No active investments yet</p>
                      <button onClick={() => setTab('invest')} className="btn-primary text-xs mt-3 px-4 py-2">Start Investing</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeInvestments.slice(0, 4).map(inv => (
                        <div key={inv.id} className="surface-2 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{inv.plan?.name ?? 'Plan'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Active</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500">Invested</p>
                              <p className="text-white font-mono">{formatCurrency(Number(inv.amount))}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Daily ROI</p>
                              <p className="text-emerald-400 font-mono">{formatCurrency(Number(inv.daily_roi))}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Earned</p>
                              <p className="text-amber-400 font-mono">{formatCurrency(Number(inv.total_earned))}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Recent Transactions</h3>
                    <button onClick={() => setTab('history')} className="text-xs text-sky-400 hover:text-sky-300">View all</button>
                  </div>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <History size={32} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              tx.type === 'deposit' || tx.type === 'roi_payout' || tx.type === 'trade_profit'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : tx.type === 'withdrawal'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-sky-500/15 text-sky-400'
                            }`}>
                              {tx.type === 'deposit' ? <ArrowDownCircle size={16} /> :
                               tx.type === 'withdrawal' ? <ArrowUpCircle size={16} /> :
                               <ArrowLeftRight size={16} />}
                            </div>
                            <div>
                              <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-white">{formatCurrency(Number(tx.amount))}</p>
                            <p className={`text-xs ${
                              tx.status === 'completed' ? 'text-emerald-400' :
                              tx.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                            }`}>{tx.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIVE TRADING TAB */}
          {tab === 'trade' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Pair Selection */}
                <div className="card lg:col-span-1">
                  <h3 className="font-semibold text-white mb-4">Markets</h3>
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {livePrices.map(pair => (
                      <button
                        key={pair.symbol}
                        onClick={() => setSelectedPair(pair)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left ${
                          selectedPair.symbol === pair.symbol ? 'bg-sky-600/15 border border-sky-600/30' : 'hover:bg-surface-2'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: pair.color }}>
                            {pair.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{pair.symbol}</p>
                            <p className={`text-xs ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatPercent(pair.change24h)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-white">{formatCurrency(pair.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart + Trade Panel */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: selectedPair.color }}>
                          {selectedPair.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{selectedPair.symbol}</h3>
                          <p className="text-xs text-slate-500">{selectedPair.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white font-mono">{formatCurrency(selectedPair.price)}</p>
                        <p className={`text-sm ${selectedPair.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatPercent(selectedPair.change24h)}
                        </p>
                      </div>
                    </div>
                    <TradingChart data={chartData} color={selectedPair.change24h >= 0 ? '#10b981' : '#ef4444'} height={300} />
                  </div>

                  <TradePanel
                    pair={selectedPair}
                    balance={balance}
                    onTrade={executeTrade}
                  />

                  {/* Open Positions */}
                  <div className="card">
                    <h3 className="font-semibold text-white mb-4">Open Positions</h3>
                    {openTrades.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6">No open positions. Start trading above!</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 text-xs border-b border-border">
                              <th className="text-left py-2 px-2">Pair</th>
                              <th className="text-left py-2 px-2">Side</th>
                              <th className="text-right py-2 px-2">Amount</th>
                              <th className="text-right py-2 px-2">Entry</th>
                              <th className="text-right py-2 px-2">Current</th>
                              <th className="text-right py-2 px-2">PnL</th>
                              <th className="text-center py-2 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {openTrades.map(trade => {
                              const pairData = livePrices.find(p => p.symbol === trade.pair);
                              const currentPrice = pairData?.price ?? Number(trade.price);
                              const currentValue = Number(trade.amount) * currentPrice;
                              const pnl = trade.side === 'buy' ? currentValue - Number(trade.total) : Number(trade.total) - currentValue;
                              const pnlPct = (pnl / Number(trade.total)) * 100;
                              return (
                                <tr key={trade.id} className="border-b border-border/50">
                                  <td className="py-3 px-2 font-medium text-white">{trade.pair}</td>
                                  <td className="py-3 px-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      trade.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                    }`}>
                                      {trade.side.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCrypto(Number(trade.amount))}</td>
                                  <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCurrency(Number(trade.price))}</td>
                                  <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCurrency(currentPrice)}</td>
                                  <td className={`py-3 px-2 text-right font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <button
                                      onClick={() => closeTrade(trade)}
                                      className="text-xs px-3 py-1 rounded-lg surface-2 hover:bg-surface text-white transition-colors"
                                    >
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVESTMENT PLANS TAB */}
          {tab === 'invest' && (
            <div className="space-y-6">
              <div className="card surface-2">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold text-white">Available Balance</h3>
                    <p className="text-3xl font-bold text-white font-mono mt-1">{formatCurrency(balance)}</p>
                  </div>
                  <button onClick={() => setTab('wallet')} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Deposit Funds
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                  <InvestPlanCard key={plan.id} plan={plan} balance={balance} onInvest={investInPlan} />
                ))}
              </div>

              {/* Active Investments Table */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">My Investments</h3>
                {investments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No investments yet. Choose a plan above to start earning!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs border-b border-border">
                          <th className="text-left py-2 px-2">Plan</th>
                          <th className="text-right py-2 px-2">Amount</th>
                          <th className="text-right py-2 px-2">Daily ROI</th>
                          <th className="text-right py-2 px-2">Total Earned</th>
                          <th className="text-left py-2 px-2">Start Date</th>
                          <th className="text-left py-2 px-2">End Date</th>
                          <th className="text-center py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investments.map(inv => (
                          <tr key={inv.id} className="border-b border-border/50">
                            <td className="py-3 px-2 font-medium text-white">{inv.plan?.name ?? 'Plan'}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCurrency(Number(inv.amount))}</td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-400">{formatCurrency(Number(inv.daily_roi))}</td>
                            <td className="py-3 px-2 text-right font-mono text-amber-400">{formatCurrency(Number(inv.total_earned))}</td>
                            <td className="py-3 px-2 text-slate-400">{formatDate(inv.start_date)}</td>
                            <td className="py-3 px-2 text-slate-400">{formatDate(inv.end_date)}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                inv.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                                inv.status === 'completed' ? 'bg-sky-500/15 text-sky-400' : 'bg-red-500/15 text-red-400'
                              }`}>{inv.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WALLET TAB */}
          {tab === 'wallet' && (
            <WalletTab
              balance={balance}
              onDeposit={makeDeposit}
              onWithdraw={makeWithdrawal}
              transactions={transactions.filter(t => t.type === 'deposit' || t.type === 'withdrawal')}
            />
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-semibold text-white mb-4">All Transactions</h3>
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No transactions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs border-b border-border">
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Description</th>
                          <th className="text-right py-2 px-2">Amount</th>
                          <th className="text-center py-2 px-2">Status</th>
                          <th className="text-right py-2 px-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id} className="border-b border-border/50">
                            <td className="py-3 px-2">
                              <span className="capitalize text-white font-medium">{tx.type.replace('_', ' ')}</span>
                            </td>
                            <td className="py-3 px-2 text-slate-400">{tx.description}</td>
                            <td className="py-3 px-2 text-right font-mono text-white">{formatCurrency(Number(tx.amount))}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                                tx.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                              }`}>{tx.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-400">{formatDateTime(tx.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Trade History */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Trade History</h3>
                {trades.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No trades yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs border-b border-border">
                          <th className="text-left py-2 px-2">Pair</th>
                          <th className="text-left py-2 px-2">Side</th>
                          <th className="text-right py-2 px-2">Amount</th>
                          <th className="text-right py-2 px-2">Total</th>
                          <th className="text-right py-2 px-2">PnL</th>
                          <th className="text-center py-2 px-2">Status</th>
                          <th className="text-right py-2 px-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map(trade => (
                          <tr key={trade.id} className="border-b border-border/50">
                            <td className="py-3 px-2 font-medium text-white">{trade.pair}</td>
                            <td className="py-3 px-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                trade.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                              }`}>{trade.side.toUpperCase()}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCrypto(Number(trade.amount))}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-300">{formatCurrency(Number(trade.total))}</td>
                            <td className={`py-3 px-2 text-right font-mono ${
                              Number(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>{trade.status === 'closed' ? formatCurrency(Number(trade.pnl)) : '—'}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                trade.status === 'open' ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-500/15 text-slate-400'
                              }`}>{trade.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-400">{formatDateTime(trade.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ============ Trade Panel Component ============
function TradePanel({ pair, balance, onTrade }: {
  pair: typeof CRYPTO_PAIRS[0];
  balance: number;
  onTrade: (side: 'buy' | 'sell', amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const numAmount = parseFloat(amount) || 0;
  const cryptoAmount = numAmount > 0 ? numAmount / pair.price : 0;

  const quickAmounts = [25, 50, 100, 500];

  return (
    <div className="card">
      <h3 className="font-semibold text-white mb-4">Place Order</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="surface-2 rounded-lg p-3">
          <p className="text-xs text-slate-500">Available</p>
          <p className="text-sm font-mono text-white">{formatCurrency(balance)}</p>
        </div>
        <div className="surface-2 rounded-lg p-3">
          <p className="text-xs text-slate-500">Price</p>
          <p className="text-sm font-mono text-white">{formatCurrency(pair.price)}</p>
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (USDT)</label>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="input-field mb-2 font-mono"
        placeholder="0.00"
      />
      <p className="text-xs text-slate-500 mb-3">≈ {formatCrypto(cryptoAmount)} {pair.symbol.split('/')[0]}</p>

      <div className="flex gap-2 mb-4">
        {quickAmounts.map(amt => (
          <button
            key={amt}
            onClick={() => setAmount(amt.toString())}
            className="flex-1 py-1.5 rounded-lg surface-2 text-xs text-slate-300 hover:text-white hover:border-sky-600/50 transition-colors"
          >
            ${amt}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onTrade('buy', numAmount)}
          disabled={numAmount <= 0 || numAmount > balance}
          className="btn-success py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <TrendingUp size={18} /> Buy
        </button>
        <button
          onClick={() => onTrade('sell', numAmount)}
          disabled={numAmount <= 0 || numAmount > balance}
          className="btn-danger py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <TrendingDown size={18} /> Sell
        </button>
      </div>
    </div>
  );
}

// ============ Investment Plan Card Component ============
function InvestPlanCard({ plan, balance, onInvest }: {
  plan: InvestmentPlan;
  balance: number;
  onInvest: (plan: InvestmentPlan, amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const [showInput, setShowInput] = useState(false);
  const numAmount = parseFloat(amount) || 0;
  const totalROI = plan.roi_percentage * plan.duration_days;
  const dailyEarning = numAmount > 0 ? (numAmount * plan.roi_percentage) / 100 : 0;

  const TIER_COLORS: Record<string, string> = {
    beginner: 'bg-slate-600', starter: 'bg-sky-600', intermediate: 'bg-teal-600',
    advanced: 'bg-cyan-600', professional: 'bg-blue-600', business: 'bg-amber-600',
  };

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${TIER_COLORS[plan.tier] || 'bg-slate-600'}`}>
          {plan.tier.toUpperCase()}
        </span>
        <span className="text-xs text-slate-500">{plan.duration_days} days</span>
      </div>

      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold gradient-text font-mono">{plan.roi_percentage}%</span>
        <span className="text-xs text-slate-400">/ day</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="surface-2 rounded-lg p-2">
          <p className="text-xs text-slate-500">Min</p>
          <p className="text-white font-mono">{formatCurrency(plan.min_amount)}</p>
        </div>
        <div className="surface-2 rounded-lg p-2">
          <p className="text-xs text-slate-500">Max</p>
          <p className="text-white font-mono">{formatCurrency(plan.max_amount)}</p>
        </div>
      </div>

      <div className="surface-2 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-500">Total Return</p>
        <p className="text-lg font-bold text-emerald-400 font-mono">{totalROI}%</p>
      </div>

      {showInput ? (
        <div className="space-y-3">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input-field font-mono text-sm"
            placeholder={`Min ${formatCurrency(plan.min_amount)}`}
          />
          {numAmount > 0 && (
            <div className="surface-2 rounded-lg p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Earning</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(dailyEarning)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Total Profit</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(dailyEarning * plan.duration_days)}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onInvest(plan, numAmount); setShowInput(false); setAmount(''); }}
              disabled={numAmount < plan.min_amount || numAmount > plan.max_amount || numAmount > balance}
              className="btn-primary text-sm py-2 disabled:opacity-50"
            >
              Confirm
            </button>
            <button onClick={() => { setShowInput(false); setAmount(''); }} className="btn-secondary text-sm py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowInput(true)} className="btn-primary w-full text-sm">
          Invest Now
        </button>
      )}
    </div>
  );
}

// ============ Wallet Tab Component ============
function WalletTab({ balance, onDeposit, onWithdraw, transactions }: {
  balance: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  transactions: Transaction[];
}) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-6">
      <div className="card surface-2">
        <p className="text-sm text-slate-400 mb-1">Total Wallet Balance</p>
        <p className="text-4xl font-bold text-white font-mono">{formatCurrency(balance)}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('deposit')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                mode === 'deposit' ? 'btn-primary' : 'surface-2 text-slate-400'
              }`}
            >
              <ArrowDownCircle size={16} className="inline mr-1" /> Deposit
            </button>
            <button
              onClick={() => setMode('withdraw')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                mode === 'withdraw' ? 'btn-primary' : 'surface-2 text-slate-400'
              }`}
            >
              <ArrowUpCircle size={16} className="inline mr-1" /> Withdraw
            </button>
          </div>

          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {mode === 'deposit' ? 'Deposit Amount (USDT)' : 'Withdraw Amount (USDT)'}
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input-field mb-2 font-mono"
            placeholder="0.00"
          />
          {mode === 'withdraw' && (
            <p className="text-xs text-slate-500 mb-4">Available: {formatCurrency(balance)}</p>
          )}

          <div className="flex gap-2 mb-6">
            {[50, 100, 500, 1000].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="flex-1 py-1.5 rounded-lg surface-2 text-xs text-slate-300 hover:text-white hover:border-sky-600/50 transition-colors"
              >
                ${amt}
              </button>
            ))}
          </div>

          {mode === 'deposit' ? (
            <button
              onClick={() => { onDeposit(numAmount); setAmount(''); }}
              disabled={numAmount <= 0}
              className="btn-success w-full disabled:opacity-50"
            >
              Deposit {numAmount > 0 ? formatCurrency(numAmount) : ''}
            </button>
          ) : (
            <button
              onClick={() => { onWithdraw(numAmount); setAmount(''); }}
              disabled={numAmount <= 0 || numAmount > balance}
              className="btn-danger w-full disabled:opacity-50"
            >
              Withdraw {numAmount > 0 ? formatCurrency(numAmount) : ''}
            </button>
          )}

          <div className="mt-6 p-3 rounded-lg bg-sky-600/10 border border-sky-600/20">
            <p className="text-xs text-slate-400">
              {mode === 'deposit'
                ? 'Deposits are credited instantly to your account balance. Minimum deposit: $10.'
                : 'Withdrawal requests are processed within 24 hours. Minimum withdrawal: $20.'}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white mb-4">Deposit & Withdrawal History</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No wallet transactions yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {transactions.map(tx => (
                <div key={tx.id} className="surface-2 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white">{formatCurrency(Number(tx.amount))}</p>
                    <p className={`text-xs ${
                      tx.status === 'completed' ? 'text-emerald-400' :
                      tx.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                    }`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
