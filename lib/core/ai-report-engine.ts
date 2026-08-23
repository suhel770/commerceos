import { getAiCreditsRemaining, consumeAiCredit } from "@/lib/ai/credits";

export type AiReportType =
  // Inventory
  | "inventory_executive"
  | "dead_stock_recovery"
  | "abc_analysis"
  | "stockout_risk"
  | "working_capital"
  // Purchase
  | "supplier_intelligence"
  | "vendor_risk"
  | "cost_increase"
  | "purchase_forecast"
  // Warehouse
  | "storage_capacity"
  | "labour_optimization"
  | "dock_utilization"
  | "qc_analysis"
  // Storage
  | "capacity_optimization"
  | "transfer_optimization"
  | "location_health"
  // Orders
  | "fulfillment_optimization"
  | "delay_prediction"
  // Finance
  | "cash_flow"
  | "margin_optimization"
  | "expense_intelligence";

export type CreditTier = "quick" | "forecast" | "simulation" | "audit";

export const CREDIT_TIER_COSTS: Record<CreditTier, { credits: number; label: string; description: string }> = {
  quick: { credits: 1, label: "Quick Report", description: "Standard single-metric AI summary & health check" },
  forecast: { credits: 2, label: "Business Forecast", description: "30, 60, 90-day predictive demand & risk trend" },
  simulation: { credits: 5, label: "Scenario Simulation", description: "Multi-variable what-if simulation & channel allocation" },
  audit: { credits: 8, label: "Executive Audit", description: "Comprehensive cross-engine business intelligence audit" },
};

export type ReportLifecycle = "generated" | "viewed" | "applied" | "completed" | "archived";

export interface AiFinding {
  id: string;
  category: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "opportunity";
}

export interface AiRecommendation {
  id: string;
  title: string;
  action: string;
  impactInr: number;
  isApplied: boolean;
}

export interface AiExecutiveReport {
  id: string;
  module: "inventory" | "purchase" | "warehouse" | "storage" | "orders" | "finance" | "reports" | "universal";
  reportType: AiReportType;
  reportTypeLabel: string;
  title: string;
  generatedAt: string;
  startedAt: string;
  completedAt: string;
  executionDurationMs: number;
  creditsUsed: number;
  creditTier: CreditTier;
  user: string;
  dataSources: string[];
  confidenceScorePct: number;
  healthScore: number;
  executiveSummary: string;
  keyFindings: AiFinding[];
  recommendations: AiRecommendation[];
  estimatedSavingsInr: number;
  revenueProtectedInr: number;
  workingCapitalReleasedInr: number;
  potentialRisks: string[];
  expectedRoi: string;
  appliedActions: string[];
  lifecycleState: ReportLifecycle;
  comparisonId?: string;
  version: string;
}

export interface AiEngineRoiStats {
  reportsGeneratedToday: number;
  totalReportsCount: number;
  creditsUsedToday: number;
  creditsRemaining: number;
  totalCredits: number;
  businessOpportunitiesFound: number;
  potentialSavingsInr: number;
  revenueProtectedInr: number;
  workingCapitalReleasedInr: number;
  averageRoi: string;
  acceptanceRatePct: number;
  mostValuableModule: string;
}

class AiReportEngineClass {
  private totalCredits = 250;
  private creditsRemaining = 223;
  private reportSeqByModule: Record<string, number> = {
    INV: 0,
    PUR: 0,
    STO: 0,
    WH: 0,
    ORD: 0,
    FIN: 0,
  };

  private reportsHistory: AiExecutiveReport[] = [];

  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getStats(): AiEngineRoiStats {
    return this.getRoiStats();
  }

  public getRoiStats(): AiEngineRoiStats {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayReports = this.reportsHistory.filter(
      (r) => r.generatedAt.split("T")[0] === todayStr
    );
    const creditsUsedToday = todayReports.reduce((sum, r) => sum + r.creditsUsed, 0);

    const totalSavings = this.reportsHistory.reduce((sum, r) => sum + r.estimatedSavingsInr, 0);
    const totalRevProtected = this.reportsHistory.reduce((sum, r) => sum + r.revenueProtectedInr, 0);
    const totalCapitalReleased = this.reportsHistory.reduce((sum, r) => sum + r.workingCapitalReleasedInr, 0);

    const allRecs = this.reportsHistory.flatMap((r) => r.recommendations);
    const appliedRecsCount = allRecs.filter((rec) => rec.isApplied).length;
    const acceptanceRate = allRecs.length > 0 ? Math.round((appliedRecsCount / allRecs.length) * 100) : 75;

    return {
      reportsGeneratedToday: todayReports.length,
      totalReportsCount: this.reportsHistory.length,
      creditsUsedToday,
      creditsRemaining: getAiCreditsRemaining(),
      totalCredits: this.totalCredits,
      businessOpportunitiesFound: this.reportsHistory.flatMap((r) => r.keyFindings).length,
      potentialSavingsInr: totalSavings,
      revenueProtectedInr: totalRevProtected,
      workingCapitalReleasedInr: totalCapitalReleased,
      averageRoi: "11.2x",
      acceptanceRatePct: acceptanceRate,
      mostValuableModule: "Inventory Intelligence",
    };
  }

  public getCreditsRemaining(): number {
    return getAiCreditsRemaining();
  }

  public getReportsHistory(): AiExecutiveReport[] {
    return [...this.reportsHistory];
  }

  public getReportById(id: string): AiExecutiveReport | undefined {
    return this.reportsHistory.find((r) => r.id === id);
  }

  public hasEnoughCredits(tier: CreditTier = "simulation"): boolean {
    const cost = CREDIT_TIER_COSTS[tier].credits;
    return getAiCreditsRemaining() >= cost;
  }

  public deductCredits(tier: CreditTier = "simulation"): boolean {
    const cost = CREDIT_TIER_COSTS[tier].credits;
    const remaining = consumeAiCredit(cost);
    if (remaining !== null) {
      this.notify();
      return true;
    }
    return false;
  }

  public toggleApplyRecommendation(reportId: string, recId: string): void {
    const report = this.reportsHistory.find((r) => r.id === reportId);
    if (report) {
      const rec = report.recommendations.find((rc) => rc.id === recId);
      if (rec) {
        rec.isApplied = !rec.isApplied;
        if (rec.isApplied) {
          report.lifecycleState = "applied";
          if (!report.appliedActions.includes(rec.title)) {
            report.appliedActions.push(rec.title);
          }
        }
        this.notify();
      }
    }
  }

  public updateLifecycleState(reportId: string, state: ReportLifecycle): void {
    const report = this.reportsHistory.find((r) => r.id === reportId);
    if (report) {
      report.lifecycleState = state;
      this.notify();
    }
  }

  public deleteReport(reportId: string): void {
    this.reportsHistory = this.reportsHistory.filter((r) => r.id !== reportId);
    this.notify();
  }

  public duplicateReport(reportId: string): AiExecutiveReport | undefined {
    const report = this.getReportById(reportId);
    if (!report) return undefined;

    const prefix = report.module.substring(0, 3).toUpperCase();
    this.reportSeqByModule[prefix] = (this.reportSeqByModule[prefix] || 0) + 1;
    const seqStr = String(this.reportSeqByModule[prefix]).padStart(6, "0");
    const newId = `${prefix}-AI-${seqStr}`;

    const newReport: AiExecutiveReport = {
      ...JSON.parse(JSON.stringify(report)),
      id: newId,
      title: `${report.title} (Copy)`,
      generatedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      creditsUsed: 0,
      lifecycleState: "generated",
    };

    this.reportsHistory.unshift(newReport);
    this.notify();
    return newReport;
  }

  public generateModuleReport(
    module: AiExecutiveReport["module"],
    reportType: AiReportType,
    reportTypeLabel: string,
    title: string,
    summary: string,
    healthScore: number,
    savingsInr: number,
    revenueProtectedInr: number,
    creditTier: CreditTier = "simulation",
    findings: AiFinding[] = [],
    recommendations: AiRecommendation[] = []
  ): AiExecutiveReport {
    const startTime = new Date(Date.now() - 3100).toISOString();
    const endTime = new Date().toISOString();

    const prefix = module.substring(0, 3).toUpperCase();
    this.reportSeqByModule[prefix] = (this.reportSeqByModule[prefix] || 0) + 1;
    const seqStr = String(this.reportSeqByModule[prefix]).padStart(6, "0");
    const reportId = `${prefix}-AI-${seqStr}`;

    const cost = CREDIT_TIER_COSTS[creditTier].credits;

    const report: AiExecutiveReport = {
      id: reportId,
      module,
      reportType,
      reportTypeLabel,
      title,
      generatedAt: endTime,
      startedAt: startTime,
      completedAt: endTime,
      executionDurationMs: 3100,
      creditsUsed: cost,
      creditTier,
      user: "Suhel (Admin)",
      dataSources: [
        `${module.charAt(0).toUpperCase() + module.slice(1)} Engine SOT`,
        "CommerceOS Unified Decision Intelligence",
        "Marketplace Velocity Graph",
        "Storage Network Engine",
      ],
      confidenceScorePct: 96,
      healthScore,
      executiveSummary: summary,
      keyFindings: findings,
      recommendations,
      estimatedSavingsInr: savingsInr,
      revenueProtectedInr,
      workingCapitalReleasedInr: Math.round(savingsInr * 1.5),
      potentialRisks: [
        "Stockout risk if reorder SLA exceeds 5 business days",
        "Carrying cost inflation if non-moving items are retained past 60 days",
      ],
      expectedRoi: "11.5x",
      appliedActions: [],
      lifecycleState: "generated",
      version: "v1.0",
    };

    this.deductCredits(creditTier);
    this.reportsHistory.unshift(report);
    this.notify();
    return report;
  }
}

export const aiReportEngine = new AiReportEngineClass();
