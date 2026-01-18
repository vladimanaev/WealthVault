
import React, { useMemo } from 'react';
import { StockHolding, ExchangeRates } from '../types';
import { Trash2, TrendingUp, TrendingDown, PlusCircle, Globe } from 'lucide-react';

interface PortfolioCardProps {
  holding: StockHolding;
  currencySymbol: string;
  baseCurrency: string;
  exchangeRates: ExchangeRates;
  onRemove: (symbol: string) => void;
  onUpdateContribution: (symbol: string, value: number) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  holding, 
  currencySymbol, 
  baseCurrency,
  exchangeRates,
  onRemove, 
  onUpdateContribution 
}) => {
  // Calculate display price based on current exchange rates
  const displayCurrentPrice = useMemo(() => {
    const from = holding.originalCurrency || 'USD';
    const native = holding.nativePrice || holding.currentPrice;
    if (from === baseCurrency) return native;
    
    // Convert native price to base currency using exchange rates
    const priceInBase = native / (exchangeRates[from] || 1);
    return priceInBase * (exchangeRates[baseCurrency] || 1);
  }, [holding, baseCurrency, exchangeRates]);

  const currentMarketValue = holding.shares * displayCurrentPrice;
  const totalCost = holding.totalPaid; // This is assumed to be stored in the user's primary base currency
  const profitLoss = currentMarketValue - totalCost;
  const contribution = holding.monthlyContribution || 0;
  
  const isProfit = profitLoss >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">{holding.symbol.toUpperCase()}</h3>
            <span className="px-2 py-0.5 bg-indigo-50 text-[10px] font-bold text-indigo-600 rounded uppercase">
              {currencySymbol}{displayCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2 mt-1 text-slate-500">
             <p className="text-sm font-medium">
              {holding.shares.toLocaleString()} Shares
            </p>
            {holding.originalCurrency && holding.nativePrice && (
              <>
                <span className="text-slate-300 text-xs">•</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 italic">
                  <Globe className="w-2.5 h-2.5" />
                  {holding.originalCurrency} {holding.nativePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </>
            )}
          </div>
        </div>
        <button 
          onClick={() => onRemove(holding.symbol)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Paid</p>
          <p className="text-lg font-bold text-slate-800">{currencySymbol}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Gain/Loss</p>
          <div className={`flex items-center gap-1 text-lg font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isProfit ? '+' : ''}{currencySymbol}{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-indigo-600 uppercase font-black flex items-center gap-1">
            <PlusCircle className="w-3 h-3" /> Monthly Funding
          </label>
          <span className="text-xs font-bold text-indigo-600">{currencySymbol}{contribution.toLocaleString()}</span>
        </div>
        <input 
          type="range" min="0" max="2000" step="10"
          value={contribution}
          onChange={(e) => onUpdateContribution(holding.symbol, Number(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>
      
      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
        <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase font-bold">
          Market Value: {currencySymbol}{currentMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
