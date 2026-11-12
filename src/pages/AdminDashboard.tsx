import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type InvestmentPlan } from '@/lib/supabase';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/cryptoData';
import {
  Shield, Users, Wallet, TrendingUp, Settings, LogOut, Menu, X,
  ArrowUpCircle, ArrowDownCircle, Check, XCircle, AlertCircle,
  Building2, DollarSign, Activity, Edit3, Save, Ban, Search,
  ArrowLeftRight,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'transactions' | 'investments' | 'plans';

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  balance: number;
  status: string;
  created_at: string;
};

type AdminTransaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  profile?: { email: string; full_name: string };
};

type AdminInvestment = {
  id: string;
  user_id: string;
  amount: number;
  daily_roi: number;
  total_earned: number;
  status: string;
  start_date: string;
  end_date: string;
  profile?: { email: string; full_name: string };
  plan?: { name: string };
};

type AdminStats = {
  totalUsers: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalInvested: number;
  activeInvestments: number;
};

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InvestmentPlan>>({});

  const navigate = (r: string) => { window.location.hash = `#/${r}`; };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const callAdminApi = useCallback(async (path: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api${path}`;
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return response.json();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, txRes, invRes, plansRes] = await Promise.all([
        callAdminApi('/users'),
        callAdminApi('/transactions'),
        callAdminApi('/investments'),
        callAdminApi('/plans'),
      ]);
      setUsers(usersRes.users || []);
      setStats(usersRes.stats || null);
      setTransactions(txRes.transactions || []);
      setInvestments(invRes.investments || []);
      setPlans(plansRes.plans || []);
    } catch (err) {
      showToast(`Failed to load data: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [callAdminApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateUser = async (userId: string, updates: { balance?: number; status?: string; role?: string }) => {
    try {
      await callAdminApi(`/users/${userId}/update`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
      showToast('User updated successfully');
      loadData();
    } catch (err) {
      showToast(`Update failed: ${(err as Error).message}`, 'error');
    }
  };

  const updateTxStatus = async (txId: string, status: string) => {
    try {
      await callAdminApi(`/transactions/${txId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      showToast(`Transaction ${status}`);
      loadData();
    } catch (err) {
      showToast(`Update failed: ${(err as Error).message}`, 'error');
    }
  };

  const updatePlan = async (planId: string, updates: Partial<InvestmentPlan>) => {
    try {
      await callAdminApi(`/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      showToast('Plan updated successfully');
      setEditingPlan(null);
      setEditValues({});
      loadData();
    } catch (err) {
      showToast(`Update failed: ${(err as Error).message}`, 'error');
    }
  };

  const menuItems: { id: AdminTab; label: string; icon: typeof Shield }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'plans', label: 'Plans', icon: Settings },
  ];

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const pendingTx = transactions.filter(t => t.status === 'pending');

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 surface border-r border-border z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
              <Shield size={20} />
            </div>
            <div>
              <span className="font-bold text-lg text-white">Admin Panel</span>
              <p className="text-xs text-slate-500">CryptoVault</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === item.id ? 'bg-amber-600/15 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-surface-2'
              }`}
            >
              <item.icon size={18} /> {item.label}
              {item.id === 'transactions' && pendingTx.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingTx.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className="surface-2 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-500">Admin Account</p>
            <p className="text-sm font-medium text-white truncate">{profile?.email}</p>
          </div>
          <button onClick={() => navigate('home')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-2 transition-colors">
            <Building2 size={18} /> Back to Site
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
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-lg border-b border-border h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-300" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-semibold text-white capitalize">{menuItems.find(m => m.id === tab)?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 surface-2 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 pulse-dot"></span>
              <span className="text-xs text-slate-400">Admin Mode</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-semibold text-white text-sm">
              {profile?.email?.charAt(0).toUpperCase()}
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

          {loading && !stats && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-amber-600/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-sky-400', bg: 'bg-sky-600/10' },
                  { label: 'User Balances', value: formatCurrency(stats.totalBalance), icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
                  { label: 'Total Deposits', value: formatCurrency(stats.totalDeposits), icon: ArrowDownCircle, color: 'text-teal-400', bg: 'bg-teal-600/10' },
                  { label: 'Total Withdrawals', value: formatCurrency(stats.totalWithdrawals), icon: ArrowUpCircle, color: 'text-amber-400', bg: 'bg-amber-600/10' },
                  { label: 'Total Invested', value: formatCurrency(stats.totalInvested), icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-600/10' },
                  { label: 'Active Investments', value: stats.activeInvestments.toString(), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-600/10' },
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

              {/* Pending Transactions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Pending Approvals</h3>
                  {pendingTx.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                      {pendingTx.length} pending
                    </span>
                  )}
                </div>
                {pendingTx.length === 0 ? (
                  <div className="text-center py-8">
                    <Check size={32} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTx.map(tx => (
                      <div key={tx.id} className="surface-2 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {tx.type === 'deposit' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                            <p className="text-xs text-slate-500">{tx.profile?.email || 'User'} — {formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-mono text-white">{formatCurrency(Number(tx.amount))}</p>
                          <button
                            onClick={() => updateTxStatus(tx.id, 'completed')}
                            className="btn-success text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => updateTxStatus(tx.id, 'rejected')}
                            className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Users */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="surface-2 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center font-semibold text-white text-sm">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.full_name || u.email}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">{formatCurrency(Number(u.balance))}</p>
                        <p className={`text-xs ${u.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{u.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search users by name or email..."
                  />
                </div>
                <span className="text-sm text-slate-500">{filteredUsers.length} users</span>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-border">
                      <th className="text-left py-3 px-2">User</th>
                      <th className="text-right py-3 px-2">Balance</th>
                      <th className="text-center py-3 px-2">Role</th>
                      <th className="text-center py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Joined</th>
                      <th className="text-center py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center font-semibold text-white text-xs">
                              {(u.full_name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.full_name || '—'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-white">{formatCurrency(Number(u.balance))}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-sky-500/15 text-sky-400'
                          }`}>{u.role}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                          }`}>{u.status}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                const amt = prompt(`Update balance for ${u.email}:`, u.balance.toString());
                                if (amt !== null) {
                                  const num = parseFloat(amt);
                                  if (!isNaN(num)) updateUser(u.id, { balance: num });
                                }
                              }}
                              className="text-xs px-2 py-1 rounded surface-2 hover:bg-surface text-sky-400 flex items-center gap-1"
                              title="Edit balance"
                            >
                              <DollarSign size={12} /> Balance
                            </button>
                            <button
                              onClick={() => updateUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                              className={`text-xs px-2 py-1 rounded surface-2 flex items-center gap-1 ${
                                u.status === 'active' ? 'text-red-400 hover:bg-surface' : 'text-emerald-400 hover:bg-surface'
                              }`}
                              title={u.status === 'active' ? 'Suspend user' : 'Activate user'}
                            >
                              <Ban size={12} /> {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {tab === 'transactions' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-border">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Date</th>
                    <th className="text-center py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-border/50">
                      <td className="py-3 px-2 text-slate-300">{tx.profile?.email || '—'}</td>
                      <td className="py-3 px-2">
                        <span className="capitalize text-white font-medium">{tx.type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3 px-2 text-right font-mono text-white">{formatCurrency(Number(tx.amount))}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                          tx.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-400 text-xs">{formatDateTime(tx.created_at)}</td>
                      <td className="py-3 px-2 text-center">
                        {tx.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateTxStatus(tx.id, 'completed')}
                              className="text-xs px-2 py-1 rounded bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateTxStatus(tx.id, 'rejected')}
                              className="text-xs px-2 py-1 rounded bg-red-600/15 text-red-400 hover:bg-red-600/25"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No transactions found.</p>
              )}
            </div>
          )}

          {/* INVESTMENTS */}
          {tab === 'investments' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-border">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Plan</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-right py-3 px-2">Daily ROI</th>
                    <th className="text-right py-3 px-2">Earned</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Start</th>
                    <th className="text-left py-3 px-2">End</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => (
                    <tr key={inv.id} className="border-b border-border/50">
                      <td className="py-3 px-2 text-slate-300">{inv.profile?.email || '—'}</td>
                      <td className="py-3 px-2 text-white font-medium">{inv.plan?.name || '—'}</td>
                      <td className="py-3 px-2 text-right font-mono text-white">{formatCurrency(Number(inv.amount))}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-400">{formatCurrency(Number(inv.daily_roi))}</td>
                      <td className="py-3 px-2 text-right font-mono text-amber-400">{formatCurrency(Number(inv.total_earned))}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inv.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                          inv.status === 'completed' ? 'bg-sky-500/15 text-sky-400' : 'bg-red-500/15 text-red-400'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-xs">{formatDate(inv.start_date)}</td>
                      <td className="py-3 px-2 text-slate-400 text-xs">{formatDate(inv.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {investments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No investments found.</p>
              )}
            </div>
          )}

          {/* PLANS */}
          {tab === 'plans' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => {
                const isEditing = editingPlan === plan.id;
                const vals = isEditing ? editValues : plan;
                return (
                  <div key={plan.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-600 text-white uppercase">
                        {plan.tier}
                      </span>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            updatePlan(plan.id, editValues);
                          } else {
                            setEditingPlan(plan.id);
                            setEditValues({ ...plan });
                          }
                        }}
                        className="text-xs px-2 py-1 rounded surface-2 text-sky-400 hover:bg-surface flex items-center gap-1"
                      >
                        {isEditing ? <Save size={12} /> : <Edit3 size={12} />}
                        {isEditing ? 'Save' : 'Edit'}
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500">Name</label>
                          <input
                            value={vals.name || ''}
                            onChange={e => setEditValues({ ...vals, name: e.target.value })}
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500">Min Amount</label>
                            <input
                              type="number"
                              value={vals.min_amount ?? ''}
                              onChange={e => setEditValues({ ...vals, min_amount: parseFloat(e.target.value) })}
                              className="input-field text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Max Amount</label>
                            <input
                              type="number"
                              value={vals.max_amount ?? ''}
                              onChange={e => setEditValues({ ...vals, max_amount: parseFloat(e.target.value) })}
                              className="input-field text-sm font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500">ROI %/day</label>
                            <input
                              type="number"
                              step="0.1"
                              value={vals.roi_percentage ?? ''}
                              onChange={e => setEditValues({ ...vals, roi_percentage: parseFloat(e.target.value) })}
                              className="input-field text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Duration (days)</label>
                            <input
                              type="number"
                              value={vals.duration_days ?? ''}
                              onChange={e => setEditValues({ ...vals, duration_days: parseInt(e.target.value) })}
                              className="input-field text-sm font-mono"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={vals.is_active ?? true}
                            onChange={e => setEditValues({ ...vals, is_active: e.target.checked })}
                            className="w-4 h-4 accent-sky-500"
                          />
                          Active
                        </label>
                        <button
                          onClick={() => { setEditingPlan(null); setEditValues({}); }}
                          className="btn-secondary w-full text-xs py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                        <p className="text-3xl font-bold gradient-text font-mono mb-4">{plan.roi_percentage}%/day</p>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <p className="text-xs text-slate-500">Min</p>
                            <p className="text-white font-mono">{formatCurrency(plan.min_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Max</p>
                            <p className="text-white font-mono">{formatCurrency(plan.max_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Duration</p>
                            <p className="text-white">{plan.duration_days} days</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <p className={plan.is_active ? 'text-emerald-400' : 'text-red-400'}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


