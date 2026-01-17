
export interface StockHolding {
  id: string;
  symbol: string;
  shares: number;
  totalPaid: number; // The absolute amount paid for this transaction in the user's base currency
  currentPrice: number; // Converted price in user's selected global currency
  nativePrice?: number; // Price in original asset currency
  originalCurrency?: string; // ISO 4217 code (USD, GBP, etc.)
  purchaseDate?: string;
  lastUpdated?: string;
  monthlyContribution?: number; 
}

export interface ProjectionParams {
  annualReturnRate: number;
  years: number;
}

export interface ProjectionDataPoint {
  year: number;
  principal: number;
  totalValue: number;
  contributions: number;
}

export interface MarketDataResponse {
  symbol: string;
  price: number;
  name: string;
  currency: string;
}

export type ExchangeRates = Record<string, number>;
