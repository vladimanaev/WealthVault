
import React from 'react';
import { TrendingUp, ChevronRight, ShieldCheck, PieChart, Globe, Zap } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -mr-60 -mt-60 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -ml-40 -mb-40"></div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-900/40 transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <TrendingUp className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
            Wealth<span className="text-indigo-500">Vault</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
            The sophisticated command center for your global investment portfolio and ISA wealth projections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard 
            icon={<ShieldCheck className="w-5 h-5 text-indigo-400" />}
            title="Secure Vault"
            desc="Private encrypted ledger for your stock holdings."
          />
          <FeatureCard 
            icon={<Globe className="w-5 h-5 text-blue-400" />}
            title="Multi-Currency"
            desc="Real-time FX rates via Gemini for global assets."
          />
          <FeatureCard 
            icon={<Zap className="w-5 h-5 text-emerald-400" />}
            title="Smart Forecast"
            desc="Compound interest engine with crash scenarios."
          />
        </div>

        <div className="flex justify-center">
          <div className="bg-white/5 border border-white/10 p-2 rounded-[32px] backdrop-blur-xl shadow-2xl w-full max-w-md">
            <button 
              onClick={onLogin} 
              className="w-full bg-white text-slate-900 font-bold py-5 px-8 rounded-[24px] hover:bg-slate-100 transition-all flex items-center justify-center gap-4 text-lg group shadow-xl"
            >
              Unlock Your Private Vault
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 opacity-40 grayscale contrast-125">
           <div className="flex items-center gap-2 text-white font-bold tracking-widest text-xs uppercase"><PieChart className="w-4 h-4"/> Analytics</div>
           <div className="flex items-center gap-2 text-white font-bold tracking-widest text-xs uppercase"><Globe className="w-4 h-4"/> Global FX</div>
           <div className="flex items-center gap-2 text-white font-bold tracking-widest text-xs uppercase"><TrendingUp className="w-4 h-4"/> Forecast</div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
    <div className="mb-4">{icon}</div>
    <h3 className="text-white font-bold mb-1">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
