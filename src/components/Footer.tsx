import { Shield, Mail, Twitter, Github, Linkedin } from 'lucide-react';

type FooterProps = {
  onNavigate: (route: string) => void;
};

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center font-bold text-white text-lg">
                C
              </div>
              <span className="font-bold text-xl text-white">Crypto<span className="gradient-text">Vault</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The professional crypto investment platform. Trade, invest, and grow your portfolio with confidence.
            </p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg surface-2 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-600/50 transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><button onClick={() => onNavigate('plans')} className="hover:text-sky-400 transition-colors">Investment Plans</button></li>
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-sky-400 transition-colors">Live Trading</button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-sky-400 transition-colors">About Us</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-sky-400 transition-colors">Contact</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-sky-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Trading Guide</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">API Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Get in Touch</h4>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <Mail size={16} /> support@cryptovault.io
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Shield size={16} /> 24/7 Security Monitoring
            </div>
            <button onClick={() => onNavigate('signup')} className="btn-primary text-sm w-full">
              Start Investing Today
            </button>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2026 CryptoVault. All rights reserved. Trading involves risk.</p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
