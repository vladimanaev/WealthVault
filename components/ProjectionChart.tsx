
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ProjectionDataPoint } from '../types';

interface ProjectionChartProps {
  data: ProjectionDataPoint[];
  currencySymbol: string;
}

const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg">
        <p className="font-bold text-slate-900 mb-1">Year {label}</p>
        <p className="text-sm text-blue-600">Total Portfolio: {currencySymbol}{payload[0].value.toLocaleString()}</p>
        <p className="text-sm text-slate-500">Net Contributions: {currencySymbol}{payload[1].value.toLocaleString()}</p>
        <p className="text-sm text-emerald-600 font-semibold">Gain: {currencySymbol}{(payload[0].value - payload[1].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const ProjectionChart: React.FC<ProjectionChartProps> = ({ data, currencySymbol }) => {
  return (
    <div className="h-[400px] w-full pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
            label={{ 
              value: 'Years of Growth', 
              position: 'bottom', 
              offset: 0, 
              fontSize: 12, 
              fontWeight: 600,
              fill: '#64748b' 
            }}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
          <Legend verticalAlign="top" height={40}/>
          <Area
            name="Total Portfolio Value"
            type="monotone"
            dataKey="totalValue"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
          <Area
            name="Total Contributions"
            type="monotone"
            dataKey="contributions"
            stroke="#94a3b8"
            strokeWidth={2}
            fill="none"
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectionChart;
