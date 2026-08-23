/**
 * CommerceOS V4 — Finance Domain Service
 * Orchestrates financial reporting, cashflow calculations, and transaction ledgers
 */

import type { FinanceContextFilter, FinancialTransactionDTO, IFinanceRepository, MonthlyCashflowDTO, PnLSummaryDTO, TaxSummaryDTO } from "./finance.repository.interface";
import { prismaFinanceRepository } from "./prisma-finance.repository";

export class FinanceService {
  constructor(private repo: IFinanceRepository = prismaFinanceRepository) {}

  public async getPnLSummary(filter: FinanceContextFilter): Promise<PnLSummaryDTO> {
    return this.repo.getPnLSummary(filter);
  }

  public async listTransactions(filter: FinanceContextFilter): Promise<FinancialTransactionDTO[]> {
    return this.repo.listTransactions(filter);
  }

  public async getCashflowSummary(filter: FinanceContextFilter): Promise<MonthlyCashflowDTO[]> {
    return this.repo.getCashflowSummary(filter);
  }

  public async getTaxSummary(filter: FinanceContextFilter): Promise<TaxSummaryDTO> {
    return this.repo.getTaxSummary(filter);
  }
}

export const financeService = new FinanceService();
