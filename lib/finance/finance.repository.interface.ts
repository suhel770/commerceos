/**
 * CommerceOS V4 — Finance Repository Interface
 * Typed contract for multi-tenant financial reporting and ledger queries
 */

export interface FinanceContextFilter {
  organizationId?: string;
  workspaceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PnLSummaryDTO {
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  operatingCosts: number;
  netProfit: number;
  grossMarginPercentage: number;
  inventoryAssetValue: number;
  accountsPayable: number;
  cashOnHand: number;
}

export interface FinancialTransactionDTO {
  id: string;
  type: "revenue" | "expense" | "payment";
  label: string;
  amount: number;
  date: string;
  category: string;
  referenceId?: string;
}

export interface MonthlyCashflowDTO {
  month: string;
  inflow: number;
  outflow: number;
}

export interface TaxSummaryDTO {
  inputTaxCredit: number;
  outputTaxLiability: number;
  netGstLiability: number;
}

export interface IFinanceRepository {
  getPnLSummary(filter: FinanceContextFilter): Promise<PnLSummaryDTO>;
  listTransactions(filter: FinanceContextFilter): Promise<FinancialTransactionDTO[]>;
  getCashflowSummary(filter: FinanceContextFilter): Promise<MonthlyCashflowDTO[]>;
  getTaxSummary(filter: FinanceContextFilter): Promise<TaxSummaryDTO>;
}
