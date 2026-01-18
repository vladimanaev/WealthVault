# WealthVault | Technical Documentation

WealthVault is a sophisticated investment command center designed for global investors managing ISA and general stock portfolios. It combines real-time market data retrieval via the Gemini API with a high-fidelity compound interest simulation engine.

## 🚀 Core Features

### 1. Multi-Currency Portfolio Ledger
- **Global Asset Tracking**: Support for tickers across US, UK, and European markets.
- **FX Normalization**: Automatically converts native asset prices (USD, EUR, etc.) into the user's preferred base currency (GBP, USD, or EUR) using real-time exchange rates retrieved via Gemini Search.
- **Private Partitioning**: User data is isolated in browser storage keyed to their identity, simulating a secure vault environment.

### 2. Intelligent Market Data (Gemini API)
- **AI-Powered Lookups**: Uses `gemini-3-flash-preview` with `googleSearch` tools to fetch the latest pricing, currency, and company names for any valid ticker symbol.
- **Dynamic Ticker Discovery**: Generates a curated list of trending ETFs and stocks based on global market conditions.

### 3. Allocation Analytics
- **Asset Weighting**: Visual breakdown of portfolio concentration by individual symbol.
- **Risk Profiling**: Categorizes assets into "Equities" vs "Stable" (Bonds/Cash) based on symbol heuristics (e.g., matching `BOND`, `GILT`, `VAGS`, `VGOV`).

---

## 📈 Forecasting & Simulation Logic

The projection engine in WealthVault goes beyond simple linear interest to provide a realistic "what-if" playground.

### Compound Interest Math
The engine uses **Monthly Compounding** for higher accuracy relative to annual models:
1. **Effective Monthly Rate**: Derived from the user-defined Annual Return ($R_{annual}$):
   $$R_{monthly} = (1 + R_{annual})^{1/12} - 1$$
2. **Monthly Iteration**: For every month in the projection period:
   - $Value_{new} = (Value_{current} \times (1 + R_{monthly})) + Contribution_{monthly}$
   - This ensures growth is applied to contributions throughout the year, not just at the end.

### "Black Swan" Scenario Engine
When enabled, the simulation introduces periodic market corrections:
- **Frequency**: A crash event is triggered every $N$ years (e.g., every 10 years).
- **Severity**: A percentage reduction (e.g., 20%) applied to the total portfolio value.
- **Risk-Adjusted Impact**: 
  - The impact is weighted based on the **Risk Split** slider. 
  - If the split is 80% Equity / 20% Stable, and a 20% crash occurs:
    - Equity portion is hit by $20\% \times 0.8$
    - Stable portion is hit by $20\% \times 0.2$
  - This allows users to see the protective benefit of a diversified bond/stable allocation during downturns.

---

## 🛠 Technical Architecture

- **Framework**: React 19 (ESM via esm.sh)
- **Styling**: Tailwind CSS
- **Intelligence**: `@google/genai` (Gemini 3 Flash)
- **Visualizations**: `Recharts` (Area Charts for growth, Pie Charts for allocation)
- **Icons**: `Lucide React`

## 🔐 Security & Privacy
- **Client-Side Only**: All investment data is stored in `localStorage`. No portfolio data is sent to a backend server except for the ticker symbols sent to the Gemini API for price lookups.
- **Identity Mock**: Uses a simulated Google Identity flow to demonstrate multi-user partitioning.