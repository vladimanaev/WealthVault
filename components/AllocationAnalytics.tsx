
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { StockHolding, ExchangeRates } from '../types';

interface AllocationAnalyticsProps {
  holdings: StockHolding[];
  exchangeRates: ExchangeRates;
  baseCurrency: string;
  currencySymbol: string;
}

const COLORS = ['#6366f1', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#64748b', '#8b5cf6', '#ef4444'];
const STABLE_COLORS = ['#f43f5e', '#10b981']; // Rose for Equity, Emerald for Stable

const AllocationAnalytics: React.FC<AllocationAnalyticsProps> = ({ 
  holdings, 
  exchangeRates, 
  baseCurrency, 
  currencySymbol 
}) => {
  const getConvertedValue = (h: StockHolding) => {
    const from = h.originalCurrency || baseCurrency;
    const nativePrice = h.nativePrice || h.currentPrice;
    if (from === baseCurrency) return nativePrice * h.shares;
    const priceInBase = nativePrice / (exchangeRates[from] || 1);
    return priceInBase * (exchangeRates[baseCurrency] || 1) * h.shares;
  };

  const symbolData = React.useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach(h => {
      const val = getConvertedValue(h);
      map[h.symbol] = (map[h.symbol] || 0) + val;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, exchangeRates, baseCurrency]);

  const classData = React.useMemo(() => {
    let equity = 0;
    let stable = 0;
    holdings.forEach(h => {
      const val = getConvertedValue(h);
      const isStable = /BOND|GILT|GOLD|CASH|VAGS|IGLT|VGOV/i.test(h.symbol);
      if (isStable) stable += val;
      else equity += val;
    });
    return [
      { name: 'Equities', value: equity },
      { name: 'Stable', value: stable }
    ].filter(d => d.value > 0);
  }, [holdings, exchangeRates, baseCurrency]);

  if (holdings.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">No assets to analyze</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      {/* Symbol Pie */}
      <div className="flex flex-col border-r border-slate-50 last:border-0 pr-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Asset Weight</h3>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={symbolData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {symbolData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: '1px solid #e2e8f0' }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle" 
                iconSize={6}
                wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Pie */}
      <div className="flex flex-col pl-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Risk Profile</h3>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={classData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {classData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STABLE_COLORS[index % STABLE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: '1px solid #e2e8f0' }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle" 
                iconSize={6}
                wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AllocationAnalytics;
