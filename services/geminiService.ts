
import { GoogleGenAI, Type } from "@google/genai";
import { MarketDataResponse, ExchangeRates } from "../types";

// Always use named parameter for apiKey and obtain from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchMarketData = async (symbol: string): Promise<MarketDataResponse | null> => {
  try {
    // Use gemini-3-flash-preview for general text/search tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current price for ticker: ${symbol}. Return JSON with symbol, price, name, and currency (ISO 4217).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            price: { type: Type.NUMBER },
            name: { type: Type.STRING },
            currency: { type: Type.STRING },
          },
          required: ["symbol", "price", "name", "currency"]
        }
      },
    });

    // Access .text property directly (not a method)
    const text = response.text;
    return text ? (JSON.parse(text) as MarketDataResponse) : null;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
};

export const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Fetch current exchange rates for ${baseCurrency} against USD, EUR, and GBP. Return as a JSON object: { "USD": rate, "EUR": rate, "GBP": rate }.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            USD: { type: Type.NUMBER },
            EUR: { type: Type.NUMBER },
            GBP: { type: Type.NUMBER },
          },
          required: ["USD", "EUR", "GBP"]
        }
      },
    });

    const text = response.text;
    return text ? (JSON.parse(text) as ExchangeRates) : { USD: 1, EUR: 1, GBP: 1 };
  } catch (error) {
    console.error("Error fetching FX rates:", error);
    return { USD: 1, EUR: 1, GBP: 1 };
  }
};

export interface TickerOption {
  value: string;
  label: string;
}

export interface TickerGroup {
  group: string;
  options: TickerOption[];
}

export const fetchTickerList = async (): Promise<TickerGroup[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Return a grouped JSON of 50 popular investment tickers for global investors. 
      Format label as "SYMBOL - Descriptive Name" (e.g. "VWRP - Vanguard All-World"). 
      Groups: "Global ETFs", "S&P 500 & US Stocks", "UK & Europe", "Bonds & Alternatives". 
      Include VWRP, VUSA, VUAG, SWDA, AAPL, MSFT, NVDA, ISF, VAGS, and TBLA (Taboola). Be extremely concise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              group: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.STRING },
                    label: { type: Type.STRING }
                  },
                  required: ["value", "label"]
                }
              }
            },
            required: ["group", "options"]
          }
        }
      }
    });

    const text = response.text;
    if (text) return JSON.parse(text) as TickerGroup[];
    throw new Error("Empty response");
  } catch (error) {
    console.error("Error fetching ticker list:", error);
    return [
      { group: "Global Equity", options: [{ value: "VWRP", label: "VWRP - Vanguard FTSE All-World" }, { value: "SWDA", label: "SWDA - iShares Core MSCI World" }] },
      { group: "US Equity", options: [{ value: "VUSA", label: "VUSA - Vanguard S&P 500" }, { value: "AAPL", label: "AAPL - Apple Inc." }, { value: "TBLA", label: "TBLA - Taboola.com Ltd." }] },
      { group: "Bonds", options: [{ value: "VAGS", label: "VAGS - Vanguard Global Agg Bond" }] }
    ];
  }
};
