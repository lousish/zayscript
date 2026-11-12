import { useState, useEffect } from 'react';
import { supabase, type InvestmentPlan } from '@/lib/supabase';
import { CRYPTO_PAIRS, formatCurrency, formatPercent } from '@/lib/cryptoData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PriceTicker from '@/components/PriceTicker';
import { TrendingUp, Shield, Zap, ArrowRight, Check, ChartBar as BarChart3, Wallet, Globe, Lock, Users, Award, ChevronRight, Star, Building2, Clock, DollarSign, PiggyBank, Briefcase, Sparkles, ArrowUpRight, Layers, Calculator, Crown } from 'lucide-react';

type LandingPageProps = { route: string };

const TIER_STYLES: Record<string, { gradient: string; border: string; badge: string; glow: string }> = {
  beginner: { gradient: 'from-slate-600 to-slate-700', border: 'border-slate-500/50', badge: 'bg-slate-600', glow: '' },
  starter: { gradient: 'from-sky-600 to-sky-700', border: 'border-sky-500/50', badge: 'bg-sky-600', glow: '' },
  intermediate: { gradient: 'from-teal-600 to-teal-700', border: 'border-teal-500/50', badge: 'bg-teal-600', glow: '' },
  advanced: { gradient: 'from-cyan-600 to-cyan-700', border: 'border-cyan-500/60', badge: 'bg-cyan-600', glow: 'glow' },
  professional: { gradient: 'from-blue-600 to-blue-700', border: 'border-blue-500/60', badge: 'bg-blue-600', glow: 'glow' },
  business: { gradient: 'from-amber-600 to-amber-700', border: 'border-amber-500/60', badge: 'bg-amber-600', glow: 'glow' },
};

export default function LandingPage({ route }: LandingPageProps) {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [livePrices, setLivePrices] = useState(CRYPTO_PAIRS);
  const [animatedStats, setAnimatedStats] = useState({ investors: 0, volume: 0, countries: 0, paidOut: 0 });
  const navigate = (r: string) => { window.location.hash = `#/${r}`; };

  useEffect(() => {
    supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setPlans(data as InvestmentPlan[]); });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev =>
        prev.map(p => {
          const change = (Math.random() - 0.48) * p.price * 0.002;
          return { ...p, price: Math.max(0.0001, p.price + change) };
        }),
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targets = { investors: 128450, volume: 2_400_000_000, countries: 183, paidOut: 847_000_000 };
    const duration = 2000;
    const steps = 60;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        investors: Math.floor(targets.investors * ease),
        volume: Math.floor(targets.volume * ease),
        countries: Math.floor(targets.countries * ease),
        paidOut: Math.floor(targets.paidOut * ease),
      });
      if (current >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  const heroImage = 'https://images.pexels.com/photos/39052111/pexels-photo-39052111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
  const bitcoinImage = 'https://images.pexels.com/photos/29968366/pexels-photo-29968366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
  const teamImage = 'https://images.pexels.com/photos/7698712/pexels-photo-7698712.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  const formatLargeNum = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return n.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar route={route} onNavigate={navigate} />
      <PriceTicker />

      {/* ============ HERO ============ */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[140px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full surface-2 text-xs font-medium text-sky-400 mb-6">
                <Sparkles size={14} />
                #1 Rated Crypto Investment Platform of 2026
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.08] mb-6 tracking-tight">
                Deposit. Invest.<br />
                <span className="gradient-text">Earn Daily ROI.</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl">
                Choose from 6 tiered investment plans with up to <span className="text-emerald-400 font-semibold">15% daily ROI</span>. Your capital is protected by our $50M insurance fund, and payouts are automated — every single day.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => navigate('signup')} className="btn-primary flex items-center gap-2 text-base px-7 py-3.5">
                  Start Investing <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('plans')} className="btn-secondary text-base px-7 py-3.5 flex items-center gap-2">
                  <Calculator size={18} /> Compare Plans
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 max-w-lg">
                {[
                  { label: 'Investors', value: animatedStats.investors.toLocaleString() + '+' },
                  { label: 'Volume', value: formatLargeNum(animatedStats.volume) },
                  { label: 'Countries', value: animatedStats.countries.toString() },
                  { label: 'Paid Out', value: formatLargeNum(animatedStats.paidOut) },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-xl sm:text-2xl font-bold text-white font-mono">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="absolute -inset-1 bg-gradient-to-br from-sky-600/20 to-cyan-500/20 rounded-3xl blur-xl"></div>
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Crypto trading analytics dashboard"
                  className="rounded-2xl w-full h-[420px] object-cover surface"
                />
                <div className="absolute -bottom-6 -left-4 sm:left-6 right-6 z-20 surface rounded-xl p-4 backdrop-blur-md glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PiggyBank size={18} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-white">ROI Calculator</span>
                    </div>
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span> Daily
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {plans.slice(0, 3).map(plan => (
                      <div key={plan.id} className="surface-2 rounded-lg p-2">
                        <p className="text-xs text-slate-500 mb-0.5">{plan.tier}</p>
                        <p className="text-sm font-bold gradient-text font-mono">{plan.roi_percentage}%</p>
                        <p className="text-[10px] text-slate-600">per day</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: '$50M Insurance Fund', sub: 'Capital protected' },
              { icon: Lock, label: '98% Cold Storage', sub: 'Bank-grade security' },
              { icon: Clock, label: '24/7 Payouts', sub: 'Automated daily ROI' },
              { icon: Globe, label: '183 Countries', sub: 'Global availability' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600/10 flex items-center justify-center text-sky-400 shrink-0">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEPOSIT PLANS + ROI ============ */}
      {(route === 'home' || route === 'plans') && (
        <section id="plans" className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
          {route === 'plans' && (
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
                <TrendingUp size={14} /> Investment Plans
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Deposit Plans & Daily ROI</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">From $50 to $1,000,000 — pick your tier, deposit, and watch your balance grow every day.</p>
            </div>
          )}

          {route === 'home' && (
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
                <Layers size={14} /> Deposit Plans
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Investment Plans with Daily ROI</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Six tiers from beginner to business. Every plan pays daily ROI directly to your balance — withdraw anytime.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const styles = TIER_STYLES[plan.tier] || TIER_STYLES.beginner;
              const isFeatured = plan.tier === 'advanced' || plan.tier === 'professional';
              const isPremium = plan.tier === 'business';
              const totalROI = plan.roi_percentage * plan.duration_days;
              const exampleDaily = (plan.min_amount * plan.roi_percentage) / 100;
              return (
                <div
                  key={plan.id}
                  className={`card card-hover relative overflow-hidden ${isFeatured ? 'lg:scale-105 border-sky-600/50 glow' : ''} ${isPremium ? 'border-amber-500/50' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {isFeatured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-sky-600 to-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                      <Star size={12} /> Popular
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                      <Crown size={12} /> Premium
                    </div>
                  )}

                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-white text-xs font-semibold mb-4`}>
                    <Building2 size={12} /> {plan.tier.toUpperCase()}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">{plan.description}</p>

                  <div className="surface-2 rounded-xl p-4 mb-5">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold gradient-text font-mono">{plan.roi_percentage}%</span>
                      <span className="text-sm text-slate-400">daily ROI</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-500">
                        Total: <span className="text-emerald-400 font-semibold">{totalROI}%</span> in {plan.duration_days} days
                      </p>
                      <p className="text-xs text-slate-500">
                        From <span className="text-white font-mono">{formatCurrency(exampleDaily)}/day</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5"><DollarSign size={14} /> Min. Deposit</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(plan.min_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5"><Briefcase size={14} /> Max. Deposit</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(plan.max_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5"><Clock size={14} /> Duration</span>
                      <span className="text-white font-semibold">{plan.duration_days} days</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('signup')}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                      isFeatured || isPremium ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Deposit & Invest <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('signup')} className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 mx-auto">
              Create your free account and start earning today <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* ============ HOW IT WORKS ============ */}
      {route === 'home' && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
              <Zap size={14} /> Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Start earning in three simple steps. No experience required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-sky-600/30 via-cyan-500/30 to-sky-600/30"></div>
            {[
              { step: '01', icon: Wallet, title: 'Create & Deposit', desc: 'Sign up in minutes and fund your account with USDT or card. Minimum deposit is just $50.' },
              { step: '02', icon: TrendingUp, title: 'Choose Your Plan', desc: 'Pick from 6 investment tiers ranging from 2.5% to 15% daily ROI based on your goals.' },
              { step: '03', icon: PiggyBank, title: 'Earn Daily ROI', desc: 'Watch your balance grow automatically every day. Withdraw your profits whenever you want.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="relative inline-flex w-24 h-24 rounded-2xl bg-sky-600/10 items-center justify-center text-sky-400 mb-5 mx-auto border border-sky-600/20">
                  <step.icon size={32} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ ROI CALCULATOR SHOWCASE ============ */}
      {route === 'home' && plans.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
                <Calculator size={14} /> ROI Breakdown
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">See Exactly How Much You Can Earn</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Transparent, predictable returns. Here's an example: deposit $10,000 into the Advanced plan and earn $750 every single day for 30 days — a total of $22,500 in profit.
              </p>

              <div className="space-y-3">
                {plans.slice(2, 6).map(plan => {
                  const deposit = plan.min_amount;
                  const daily = (deposit * plan.roi_percentage) / 100;
                  const total = daily * plan.duration_days;
                  return (
                    <div key={plan.id} className="surface-2 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TIER_STYLES[plan.tier]?.gradient || 'from-slate-600 to-slate-700'} flex items-center justify-center text-white text-xs font-bold`}>
                          {plan.tier.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{plan.name}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(deposit)} deposit · {plan.duration_days} days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(total)}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(daily)}/day</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <img
                src={bitcoinImage}
                alt="Bitcoin investment"
                className="rounded-2xl w-full h-[400px] object-cover surface"
              />
              <div className="absolute top-6 right-6 surface rounded-xl p-4 backdrop-blur-md glow">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={18} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Example Earnings</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">Deposit</span>
                    <span className="text-white font-mono">$10,000</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-sky-400 font-medium">Advanced</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">Daily ROI</span>
                    <span className="text-emerald-400 font-mono">$750</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between gap-6">
                    <span className="text-slate-300 font-medium">30-Day Total</span>
                    <span className="text-emerald-400 font-bold font-mono">$22,500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ LIVE MARKET ============ */}
      {route === 'home' && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
              <BarChart3 size={14} /> Live Market
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Trade 12+ Crypto Pairs</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Beyond investment plans, trade top cryptocurrencies with real-time pricing and zero hidden fees.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {livePrices.slice(0, 8).map(pair => (
              <div key={pair.symbol} className="card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: pair.color }}>
                      {pair.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{pair.symbol}</p>
                      <p className="text-xs text-slate-500">{pair.name}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercent(pair.change24h)}
                  </span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{formatCurrency(pair.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ FEATURES ============ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Investors Choose CryptoVault</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">A complete investment ecosystem built for both beginners and professionals.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Bank-Grade Security', desc: 'Cold storage, 2FA, and encrypted wallets keep your funds safe at all times.' },
            { icon: Zap, title: 'Instant Execution', desc: 'Trade 12+ crypto pairs with lightning-fast order matching.' },
            { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track your portfolio performance with advanced charting tools.' },
            { icon: Globe, title: 'Global Access', desc: 'Available in 183 countries with 24/7 customer support.' },
            { icon: Wallet, title: 'Easy Deposits', desc: 'Fund your account with crypto or card. Withdraw anytime.' },
            { icon: Lock, title: 'Insurance Fund', desc: 'Your investments are protected by our $50M insurance fund.' },
            { icon: Users, title: 'Expert Community', desc: 'Join 128K+ investors sharing strategies and market insights.' },
            { icon: Award, title: 'Proven Track Record', desc: 'Over $2.4B in total volume processed since 2021.' },
          ].map((f, i) => (
            <div key={i} className="card card-hover">
              <div className="w-12 h-12 rounded-xl bg-sky-600/15 flex items-center justify-center text-sky-400 mb-4">
                <f.icon size={24} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      {route === 'home' && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-sky-400 mb-4">
              <Users size={14} /> Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Our Investors Say</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Real results from real investors across the globe.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Michael R.', role: 'Business Investor', text: 'I deposited $250,000 into the Business plan and have been earning $37,500 daily. The payouts are always on time and the support team is excellent.', rating: 5 },
              { name: 'Sarah K.', role: 'Professional Trader', text: 'The Professional plan has been a game-changer. $2,500 daily ROI on my $25,000 deposit. I withdraw my profits every week with zero issues.', rating: 5 },
              { name: 'James L.', role: 'Beginner Investor', text: 'Started with just $200 on the Beginner plan. Within a week I earned $35 in ROI. It motivated me to upgrade and now I am on the Intermediate plan.', rating: 5 },
            ].map((t, i) => (
              <div key={i} className="card card-hover">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center font-semibold text-white text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ ABOUT ============ */}
      {route === 'about' && (
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-6">About CryptoVault</h1>
          <div className="space-y-6 text-slate-300 leading-relaxed">
            <p>
              Founded in 2021, CryptoVault is a leading cryptocurrency investment platform serving over 128,000 investors across 183 countries. We combine institutional-grade security with user-friendly tools to make crypto investing accessible to everyone.
            </p>
            <p>
              Our team of 50+ financial experts, blockchain engineers, and security specialists work around the clock to ensure your investments grow safely. With over $2.4 billion in total volume processed, we have built a reputation for reliability, transparency, and performance.
            </p>
            <h2 className="text-2xl font-bold text-white pt-4">Our Mission</h2>
            <p>
              To democratize access to cryptocurrency investing by providing professional-grade tools, transparent ROI plans, and bank-level security to investors of all sizes — from beginners putting in $50 to businesses investing millions.
            </p>
            <h2 className="text-2xl font-bold text-white pt-4">Security First</h2>
            <p>
              We use cold storage for 98% of all funds, multi-signature wallets, two-factor authentication, and a $50M insurance fund to protect your investments. Our platform undergoes regular security audits by leading blockchain security firms.
            </p>
            <div className="mt-8 rounded-2xl overflow-hidden">
              <img src={teamImage} alt="CryptoVault team" className="w-full h-[300px] object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* ============ CONTACT ============ */}
      {route === 'contact' && (
        <section className="py-20 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">Get in Touch</h1>
          <p className="text-slate-400 text-center mb-10">Have questions? Our support team is available 24/7.</p>
          <div className="card">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <input className="input-field" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                <textarea className="input-field min-h-[120px] resize-none" placeholder="How can we help?" />
              </div>
              <button className="btn-primary w-full">Send Message</button>
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      {route === 'home' && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative surface rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-cyan-500/10"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-sky-600/15 rounded-full blur-[120px]"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium text-emerald-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
                Join 128,450+ investors earning daily
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Ready to Start Earning?</h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8">Create your free account, deposit funds, and start earning daily ROI in minutes. Your capital is protected.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('signup')} className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 justify-center">
                  Create Free Account <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('login')} className="btn-secondary text-base px-8 py-3.5 justify-center">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer onNavigate={navigate} />
    </div>
  );
}
