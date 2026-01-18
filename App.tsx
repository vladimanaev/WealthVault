import React, { useState, useEffect, useMemo } from 'react';
import { StockHolding, ProjectionParams, ProjectionDataPoint, ExchangeRates } from './types';
import { fetchMarketData, fetchTickerList, TickerGroup, fetchExchangeRates } from './services/geminiService';
import { db } from './services/db';
import PortfolioCard from './components/PortfolioCard';
import ProjectionChart from './components/ProjectionChart';
import AllocationAnalytics from './components/AllocationAnalytics';
import LandingPage from './components/LandingPage';
import { 
  Plus, 
  TrendingUp, 
  Wallet, 
  Settings2, 
  Loader2, 
  Sparkles, 
  ReceiptText,
  CloudCheck,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Layers,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  Fingerprint,
  Mail,
  ZapOff,
  Zap,
  AlertTriangle,
  Scale,
  PieChart as PieIcon,
  CloudUpload,
  Database,
  Info
} from 'lucide-react';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

type Currency = 'GBP' | 'USD' | 'EUR';

const CURRENCY_MAP: Record<Currency, { symbol: string; label: string }> = {
  GBP: { symbol: '£', label: 'GBP' },
  USD: { symbol: '$', label: 'USD' },
  EUR: { symbol: '€', label: 'EUR' }
};

const CACHE_KEY_TICKERS = 'vault_global_tickers_v3';

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ GBP: 1, USD: 1.25, EUR: 1.18 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tickerGroups, setTickerGroups] = useState<TickerGroup[]>([]);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [scenariosActive, setScenariosActive] = useState(false);
  const [crashFrequency, setCrashFrequency] = useState(10); 
  const [crashSeverity, setCrashSeverity] = useState(20); 
  const [riskSplit, setRiskSplit] = useState(80);

  const curSym = CURRENCY_MAP[currency].symbol;

  const getConvertedPrice = (nativePrice: number, from: string, to: string) => {
    if (from === to) return nativePrice;
    const priceInBase = nativePrice / (exchangeRates[from] || 1);
    return priceInBase * (exchangeRates[to] || 1);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('vault_user');
    const savedCurrency = localStorage.getItem('vault_preferred_currency');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    // Fix: Cast the string retrieved from localStorage to the Currency type after checking it's a valid value.
    if (savedCurrency && (savedCurrency === 'GBP' || savedCurrency === 'USD' || savedCurrency === 'EUR')) {
      setCurrency(savedCurrency as Currency);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('vault_preferred_currency', currency);
  }, [currency]);

  useEffect(() => {
    const loadTickers = async () => {
      const cached = localStorage.getItem(CACHE_KEY_TICKERS);
      if (typeof cached === 'string' && cached !== '') {
        try {
          const parsed = JSON.parse(cached) as TickerGroup[];
          setTickerGroups(parsed);
          return;
        } catch (e) {
          console.error("Cache corrupted");
        }
      }
      try {
        const list = await fetchTickerList();
        setTickerGroups(list);
        localStorage.setItem(CACHE_KEY_TICKERS, JSON.stringify(list));
      } catch (err) {
        console.error("Failed to fetch tickers", err);
      }
    };
    loadTickers();
  }, []);

  useEffect(() => {
    if (!user) {
      setHoldings([]);
      setIsInitialLoad(false);
      return;
    }

    const loadUserDataFromDB = async () => {
      setIsInitialLoad(true);
      setIsSyncing(true);
      try {
        const loadedHoldings = await db.getHoldings(user.sub);
        setHoldings(loadedHoldings);
        setIsLogFormOpen(loadedHoldings.length === 0);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Critical: Failed to fetch from database", err);
      } finally {
        setIsInitialLoad(false);
        setIsSyncing(false);
      }
    };

    loadUserDataFromDB();
  }, [user]);

  useEffect(() => {
    if (isInitialLoad || !user) return;
    const syncToDatabase = async () => {
      setIsSyncing(true);
      try {
        await db.saveHoldings(user.sub, holdings);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to sync to database", err);
      } finally {
        setIsSyncing(false);
      }
    };
    const debounceTimer = setTimeout(syncToDatabase, 400);
    return () => clearTimeout(debounceTimer);
  }, [holdings, isInitialLoad, user]);

  const handleLogin = () => {
    const mockUser: GoogleUser = {
      name: "Alex Investor",
      email: "alex@investor.com",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      sub: "google_user_isa_vault_777"
    };
    localStorage.setItem('vault_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_user');
    setUser(null);
    setIsProfileModalOpen(false);
  };

  const refreshAllPrices = async () => {
    if (isRefreshingAll) return;
    setIsRefreshingAll(true);
    try {
      const rates = await fetchExchangeRates(currency);
      setExchangeRates(rates);
      if (holdings.length > 0) {
        const uniqueSymbols = Array.from(new Set(holdings.map(h => h.symbol)));
        const priceUpdates = await Promise.all(
          uniqueSymbols.map(async (symbol) => {
            const data = await fetchMarketData(symbol);
            return { symbol, price: data?.price || null, currency: data?.currency || 'USD' };
          })
        );
        setHoldings(prev => prev.map(h => {
          const update = priceUpdates.find(u => u.symbol === h.symbol);
          if (update && update.price) {
            return { 
              ...h, 
              nativePrice: update.price,
              originalCurrency: update.currency,
              currentPrice: getConvertedPrice(update.price, update.currency, currency),
              lastUpdated: new Date().toISOString() 
            };
          }
          return h;
        }));
      }
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState<number | string>('');
  const [newTotalPaid, setNewTotalPaid] = useState<number | string>('');
  const [isLoading, setIsLoading] = useState(false);

  const [projection, setProjection] = useState<ProjectionParams>({
    annualReturnRate: 7,
    years: 25
  });

  const currentTotalValue = useMemo(() => 
    holdings.reduce((sum, h) => {
      const livePrice = getConvertedPrice(h.nativePrice || h.currentPrice, h.originalCurrency || currency, currency);
      return sum + (h.shares * livePrice);
    }, 0)
  , [holdings, currency, exchangeRates]);

  const portfolioMix = useMemo(() => {
    let stockVal = 0;
    let bondVal = 0;
    holdings.forEach(h => {
      const val = h.shares * getConvertedPrice(h.nativePrice || h.currentPrice, h.originalCurrency || currency, currency);
      const isStable = /BOND|GILT|GOLD|CASH|VAGS|IGLT|VGOV/i.test(h.symbol);
      if (isStable) bondVal += val;
      else stockVal += val;
    });
    const total = stockVal + bondVal || 1;
    return { stockPct: stockVal / total, bondPct: bondVal / total };
  }, [holdings, currency, exchangeRates]);

  const totalMonthlyContribution = useMemo(() => 
    holdings.reduce((sum, h) => sum + (h.monthlyContribution || 0), 0)
  , [holdings]);

  const groupedHoldings = useMemo(() => {
    const groups: Record<string, StockHolding[]> = {};
    holdings.forEach(h => {
      if (!groups[h.symbol]) groups[h.symbol] = [];
      groups[h.symbol].push(h);
    });
    return groups;
  }, [holdings]);

  const sortedSymbols = useMemo(() => Object.keys(groupedHoldings).sort(), [groupedHoldings]);

  const updateAssetContribution = (symbol: string, value: number) => {
    setHoldings(prev => prev.map(h => h.symbol === symbol ? { ...h, monthlyContribution: value } : h));
  };

  const updateTransaction = (id: string, shares: number, totalPaid: number) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, shares, totalPaid } : h));
    setEditingTransactionId(null);
  };

  const projectionData = useMemo(() => {
    const data: ProjectionDataPoint[] = [];
    let runningTotal = currentTotalValue;
    let runningContributions = 0;
    data.push({ year: 0, principal: currentTotalValue, totalValue: currentTotalValue, contributions: 0 });
    for (let i = 1; i <= projection.years; i++) {
      const annualRate = projection.annualReturnRate / 100;
      const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
      for (let m = 0; m < 12; m++) {
        runningTotal = (runningTotal * (1 + monthlyRate)) + totalMonthlyContribution;
        runningContributions += totalMonthlyContribution;
      }
      if (scenariosActive && i > 0 && i % crashFrequency === 0) {
        const stockCrashPart = portfolioMix.stockPct * (crashSeverity * (riskSplit / 100));
        const bondCrashPart = portfolioMix.bondPct * (crashSeverity * ((100 - riskSplit) / 100));
        const totalImpactPct = stockCrashPart + bondCrashPart;
        runningTotal = runningTotal * (1 - (totalImpactPct / 100));
      }
      data.push({
        year: i,
        principal: currentTotalValue,
        totalValue: Math.max(0, Math.round(runningTotal)),
        contributions: Math.round(runningContributions)
      });
    }
    return data;
  }, [currentTotalValue, totalMonthlyContribution, projection, scenariosActive, crashFrequency, crashSeverity, portfolioMix, riskSplit]);

  const addHolding = async () => {
    if (!newSymbol || !newShares || !newTotalPaid) return;
    setIsLoading(true);
    try {
      const marketData = await fetchMarketData(newSymbol);
      const assetPrice = marketData?.price || 1;
      const assetCurrency = marketData?.currency || 'USD';
      const newHolding: StockHolding = {
        id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
        symbol: newSymbol.toUpperCase().trim(),
        shares: Number(newShares),
        totalPaid: Number(newTotalPaid),
        nativePrice: assetPrice,
        originalCurrency: assetCurrency,
        currentPrice: getConvertedPrice(assetPrice, assetCurrency, currency),
        purchaseDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        monthlyContribution: 0
      };
      setHoldings(prev => [...prev, newHolding]);
      setNewSymbol(''); setNewShares(''); setNewTotalPaid('');
      setIsLogFormOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const removeHolding = (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  if (authLoading) return null;
  if (!user) return <LandingPage onLogin={handleLogin} />;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connecting to Vault DB</h2>
        <p className="text-slate-400">Initializing secure indexed storage...</p>
      </div>
    );
  }

  const finalProjection = projectionData[projectionData.length - 1];
  const totalOutlay = currentTotalValue + finalProjection.contributions;
  const simulatedProfit = finalProjection.totalValue - totalOutlay;
  const isSimulatedProfit = simulatedProfit >= 0;

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">WealthVault</h1>
            </div>
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-slate-400 group cursor-help relative">
                {isSyncing ? <><RefreshCw className="w-3 h-3 animate-spin text-indigo-500" /> SYNCING...</> : <><Database className="w-3 h-3 text-emerald-500" /> LOCAL VAULT</>}
                <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl leading-relaxed">
                  <Info className="w-2 h-2 inline mr-1" /> Data is stored safely in your browser's IndexedDB. No cloud sync is active.
                </div>
              </div>
              {lastSaved && !isSyncing && <span className="text-[8px] text-slate-300 font-bold ml-2 uppercase">Local Persistence Active</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['GBP', 'USD', 'EUR'] as Currency[]).map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${currency === c ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {CURRENCY_MAP[c].label}
                </button>
              ))}
            </div>
            <button onClick={refreshAllPrices} disabled={isRefreshingAll} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              {isRefreshingAll ? 'SYNCING...' : 'REFRESH MARKET'}
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Portfolio Value</span>
              <span className="text-xl font-black text-slate-900">{curSym}{currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <img src={user.picture} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" alt="Profile" />
              <span className="hidden lg:block text-xs font-bold text-slate-700">{user.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 h-24 relative">
              <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-8 pb-8 -mt-12 text-center relative">
              <div className="inline-block p-1.5 bg-white rounded-full shadow-lg mb-4">
                <img src={user.picture} className="w-20 h-20 rounded-full border-4 border-slate-50" alt={user.name} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{user.name}</h3>
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-sm font-medium mb-6">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Database className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Database ID</p>
                    <p className="text-xs font-mono text-slate-600 truncate max-w-[180px]">{user.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Status</p>
                    <p className="text-xs font-bold text-slate-600">Encrypted Local Persistence</p>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all group">
                <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                Sign Out & Lock Vault
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className={`bg-white rounded-2xl shadow-sm border ${isLogFormOpen ? 'border-indigo-100 ring-2 ring-indigo-50' : 'border-slate-200'} transition-all overflow-hidden`}>
            <button onClick={() => setIsLogFormOpen(!isLogFormOpen)} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left">
              <div className="flex items-center gap-3 text-slate-800">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLogFormOpen ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  {isLogFormOpen ? <X className="w-5 h-5" /> : <ReceiptText className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 leading-tight">Log New Transaction</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{isLogFormOpen ? 'Cancel entry' : 'Add asset purchase'}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isLogFormOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isLogFormOpen ? 'max-h-[500px] opacity-100 p-6 pt-0 border-t border-slate-50' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="space-y-4 mt-6">
                <select value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                  <option value="">-- Select Asset Ticker --</option>
                  {tickerGroups.map((group, idx) => (
                    <optgroup key={idx} label={group.group} className="font-bold">
                      {group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={newShares} onChange={(e) => setNewShares(e.target.value)} placeholder="0 Shares" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                  <input type="number" value={newTotalPaid} onChange={(e) => setNewTotalPaid(e.target.value)} placeholder={`Total Paid (${curSym})`} className="w-full px-4 py-2.5 border border-indigo-100 bg-indigo-50/20 rounded-xl font-bold text-indigo-900" />
                </div>
                <button onClick={addHolding} disabled={isLoading || !newSymbol || !newShares || !newTotalPaid} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Add to Portfolio</>}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 px-1"><Layers className="w-5 h-5 text-indigo-500" /> Asset Summary</h2>
            {sortedSymbols.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center shadow-sm">
                <CloudUpload className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No transactions found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedSymbols.map(symbol => {
                  const items = groupedHoldings[symbol];
                  const aggregateHolding: StockHolding = {
                    ...items[0],
                    shares: items.reduce((sum, i) => sum + i.shares, 0),
                    totalPaid: items.reduce((sum, i) => sum + i.totalPaid, 0),
                  };
                  return (
                    <div key={symbol} className="space-y-3">
                      <PortfolioCard 
                        holding={aggregateHolding} 
                        currencySymbol={curSym} 
                        baseCurrency={currency}
                        exchangeRates={exchangeRates}
                        onRemove={() => setHoldings(prev => prev.filter(h => h.symbol !== symbol))} 
                        onUpdateContribution={updateAssetContribution} 
                      />
                      <div className="ml-4 pl-4 border-l-2 border-slate-200 space-y-2">
                        {items.map(h => (
                          <div key={h.id} className="bg-white border border-slate-100 rounded-lg p-3 text-xs shadow-sm group">
                            {editingTransactionId === h.id ? (
                              <TransactionEditForm holding={h} currencySymbol={curSym} onSave={(s, t) => updateTransaction(h.id, s, t)} onCancel={() => setEditingTransactionId(null)} />
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[10px] text-slate-400">#{h.id.slice(-4)}</span>
                                  <span className="font-bold text-slate-700">{h.shares.toLocaleString()} Shares</span>
                                  <span className="text-slate-400">@ {curSym}{(h.totalPaid / h.shares).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingTransactionId(h.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => removeHolding(h.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><PieIcon className="w-4 h-4" /></div>
              <h2 className="text-sm font-bold text-slate-900">Allocation Analytics</h2>
            </div>
            <AllocationAnalytics holdings={holdings} exchangeRates={exchangeRates} baseCurrency={currency} currencySymbol={curSym} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Compound Forecast</h2>
              </div>
              <div className="flex items-center gap-2">
                {scenariosActive && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Scenarios Active</span>}
                <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase">Horizon: {projection.years}y</div>
              </div>
            </div>
            <div className="relative group">
               <div className="absolute top-0 right-0 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                 Projection math based on monthly compounding.
               </div>
               <ProjectionChart data={projectionData} currencySymbol={curSym} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-2">Projected Value</p>
                <p className="text-2xl font-black">{curSym}{finalProjection.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Total Outlay</p>
                <p className="text-2xl font-black text-slate-600">{curSym}{totalOutlay.toLocaleString()}</p>
              </div>
              <div className={`${isSimulatedProfit ? 'bg-emerald-50' : 'bg-rose-50'} p-5 rounded-2xl border transition-colors`}>
                <p className={`text-[10px] font-bold ${isSimulatedProfit ? 'text-emerald-600' : 'text-rose-600'} uppercase mb-2`}>{isSimulatedProfit ? 'Simulated Profit' : 'Net Loss'}</p>
                <p className={`text-2xl font-black ${isSimulatedProfit ? 'text-emerald-700' : 'text-rose-700'}`}>{isSimulatedProfit ? '' : '-' }{curSym}{Math.abs(simulatedProfit).toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Settings2 className="w-5 h-5 text-indigo-400" /></div>
                  <div>
                    <h3 className="font-bold text-lg">Simulation Engine</h3>
                    <p className="text-slate-400 text-xs">Configure timeline and return expectations</p>
                  </div>
                </div>
                <button onClick={() => setScenariosActive(!scenariosActive)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${scenariosActive ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
                  {scenariosActive ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {scenariosActive ? 'Disable Scenarios' : 'Enable Scenarios'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between mb-3"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Return</label><span className="text-emerald-400 font-black text-xl">{projection.annualReturnRate}%</span></div>
                    <input type="range" min="-15" max="20" step="0.1" value={projection.annualReturnRate} onChange={(e) => setProjection({...projection, annualReturnRate: Number(e.target.value)})} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-3"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investment Period</label><span className="text-blue-400 font-black text-xl">{projection.years} Years</span></div>
                    <input type="range" min="1" max="50" value={projection.years} onChange={(e) => setProjection({...projection, years: Number(e.target.value)})} className="w-full accent-blue-500" />
                  </div>
                </div>
                <div className={`space-y-8 transition-all duration-500 ${scenariosActive ? 'opacity-100 translate-x-0' : 'opacity-30 pointer-events-none translate-x-4'}`}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-3"><label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Frequency</label></div>
                      <div className="flex items-center gap-2">
                        <input type="range" min="2" max="25" step="1" value={crashFrequency} onChange={(e) => setCrashFrequency(Number(e.target.value))} className="flex-1 accent-rose-500" />
                        <span className="text-xs font-bold text-rose-300 w-8">{crashFrequency}y</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-3"><label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Severity</label></div>
                      <div className="flex items-center gap-2">
                        <input type="range" min="5" max="60" step="1" value={crashSeverity} onChange={(e) => setCrashSeverity(Number(e.target.value))} className="flex-1 accent-rose-500" />
                        <span className="text-xs font-bold text-rose-300 w-10">-{crashSeverity}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Scale className="w-3.5 h-3.5 text-indigo-400" /><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crash Impact Split</label></div>
                      <div className="flex gap-3 text-[10px] font-black uppercase"><span className="text-rose-400">Equity: {riskSplit}%</span><span className="text-emerald-400">Stable: {100 - riskSplit}%</span></div>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={riskSplit} onChange={(e) => setRiskSplit(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const TransactionEditForm = ({ holding, currencySymbol, onSave, onCancel }: any) => {
  const [shares, setShares] = useState(holding.shares);
  const [total, setTotal] = useState(holding.totalPaid);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-200 rounded outline-none" placeholder="Shares" />
        <input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-200 rounded outline-none" placeholder={`Total Paid (${currencySymbol})`} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
        <button onClick={() => onSave(shares, total)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded"><Check className="w-3 h-3" /> Save</button>
      </div>
    </div>
  );
};

export default App;