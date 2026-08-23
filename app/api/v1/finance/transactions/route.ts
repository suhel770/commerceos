/**
 * CommerceOS Finance Transactions API Route
 * GET /api/v1/finance/transactions - Returns financial ledger transactions from PostgreSQL
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { financeApplication } from "@/lib/application/finance.application";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    const transactions = await financeApplication.listTransactions(context);
    return successResponse(context, transactions);
  } catch (error) {
    return errorResponse(context, error);
  }
}
