import { ContractorTrade, CurrencyCode, UnitOfMeasure } from './domain.constants';

/**
 * One line in the platform's reference price list for reconstruction services —
 * port of the legacy `priceList/ServicesPriceList`. These are the agreed unit
 * rates operators cost estimates and statements against, grouped by trade.
 */
export interface PriceListItem {
  id: string;
  code: string;
  serviceName: string;
  trade: ContractorTrade;
  unit: UnitOfMeasure;
  rate: number;
  currency: CurrencyCode;
  updatedAt: string;
}
