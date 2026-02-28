/**
 * Service to fetch real market data from public APIs (BCB, HG Brasil, etc.)
 */

const BCB_API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// Series IDs for BCB
const SELIC_SERIE = 11; // Taxa Selic acumulada no mês em %
const IPCA_SERIE = 433; // IPCA - Variação mensal em %

export const fetchMarketData = async () => {
 try {
 // Fetch SELIC (last value)
 const selicRes = await fetch(`${BCB_API_BASE}/${SELIC_SERIE}/dados/ultimos/1?formato=json`);
 const selicData = await selicRes.json();

 // Fetch IPCA (last value)
 const ipcaRes = await fetch(`${BCB_API_BASE}/${IPCA_SERIE}/dados/ultimos/1?formato=json`);
 const ipcaData = await ipcaRes.json();

 const data = {
 selic: parseFloat(selicData[0].valor),
 ipca: parseFloat(ipcaData[0].valor),
 updatedAt: new Date().toISOString()
 };

 // Cache in localStorage
 localStorage.setItem('sf_market_data', JSON.stringify(data));

 return data;
 } catch (error) {
 console.error('Error fetching market data:', error);
 // Fallback to defaults or cached data
 const cached = localStorage.getItem('sf_market_data');
 return cached ? JSON.parse(cached) : { selic: 0.85, ipca: 0.42, updatedAt: null };
 }
};

/**
 * Hook or function to get annual rates
 */
export const getAnnualRates = async () => {
 await fetchMarketData();

 // Convert monthly to annual (approximate or compound)
 // For Selic (11 is already daily/monthly compounded usually, but series 11 is % per day in some contexts, 
 // actually series 11 is % over the period. Series 4189 is Selic Target year rate)

 // Let's try getting the Selic Meta (Target) which is annual
 try {
 const metaRes = await fetch(`${BCB_API_BASE}/432/dados/ultimos/1?formato=json`);
 const metaData = await metaRes.json();
 const annualSelic = parseFloat(metaData[0].valor) / 100;

 // For IPCA, we usually want accumulated 12m, but series 433 is monthly.
 // Let's return compound IPCA from last month just as a reference or use a fixed 12m series 13522
 const ipca12mRes = await fetch(`${BCB_API_BASE}/13522/dados/ultimos/1?formato=json`);
 const ipca12mData = await ipca12mRes.json();
 const annualIpca = parseFloat(ipca12mData[0].valor) / 100;

 return {
 selic: annualSelic,
 ipca: annualIpca,
 cdi: annualSelic - 0.001 // CDI is usually Selic - 0.10%
 };
 } catch {
 return { selic: 0.1075, ipca: 0.045, cdi: 0.1065 };
 }
};
