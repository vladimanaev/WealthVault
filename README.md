# WealthVault | Technical Documentation

WealthVault is a sophisticated investment command center designed for global investors managing ISA and general stock portfolios. It combines real-time market data retrieval via the Gemini API with a high-fidelity compound interest simulation engine.

## 🔐 Data & Privacy (The "Vault" Concept)

**Where is my data saved?**
WealthVault follows a **Local-First Architecture**. 
- **Database**: It uses **IndexedDB**, a powerful NoSQL database built into your web browser.
- **Remote Sync**: By default, there is **no remote database**. Your investment numbers, stock holdings, and transaction history stay exclusively on your device.
- **Privacy**: No financial data is sent to external servers. The only outgoing requests are to the Gemini API to fetch market prices for the ticker symbols you provide.

---

## 🚀 Core Features

### 1. Multi-Currency Portfolio Ledger
- **Global Asset Tracking**: Support for tickers across US, UK, and European markets.
- **FX Normalization**: Automatically converts native asset prices (USD, EUR, etc.) into the user's preferred base currency (GBP, USD, or EUR) using real-time exchange rates.
- **Persistent Storage**: Data survives page refreshes and browser restarts via the `VaultDatabase` (IndexedDB).

### 2. Intelligent Market Data (Gemini API)
- **AI-Powered Lookups**: Uses `gemini-3-flash-preview` with `googleSearch` to fetch pricing.

---

## 📈 Forecasting & Simulation Logic
... (Rest of content remains the same) ...
