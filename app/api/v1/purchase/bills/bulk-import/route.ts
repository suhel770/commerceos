/**
 * CommerceOS Purchase Bulk Import API Route
 * POST /api/v1/purchase/bills/bulk-import
 * Accepts validated multi-sheet / CSV bills and executes atomic database import
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { validateAndParsePurchaseExcel } from "@/lib/purchase/excel-importer";
import { checkServerDuplicateInvoices, executeAtomicPurchaseExcelImport } from "@/lib/purchase/excel-importer.server";
import { purchaseApplication } from "@/lib/application/purchase.application";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { fileContent, fileName } = body;

    if (!fileContent || !fileName) {
      return errorResponse(context, new Error("fileContent and fileName are required."));
    }

    // 1. Fetch active master vendors for tenant context
    const vendors = await purchaseApplication.listVendors(context);

    // 2. Validate and parse Excel content
    const validationResult = await validateAndParsePurchaseExcel(
      context,
      fileContent,
      fileName,
      vendors,
    );

    if (!validationResult.isValid) {
      return successResponse(context, {
        success: false,
        validationResult,
      });
    }

    // 3. If action === "validate_only", return validation result for preview
    if (body.action === "validate_only") {
      return successResponse(context, {
        success: true,
        validationResult,
      });
    }

    // 4. Execute Atomic Bulk Creation using existing application & repository layers
    const importResult = await executeAtomicPurchaseExcelImport(
      context,
      validationResult.bills,
    );

    return successResponse(context, {
      success: true,
      createdCount: importResult.createdCount,
      createdBills: importResult.createdBills,
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
