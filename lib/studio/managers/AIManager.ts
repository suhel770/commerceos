import type {
  AIInsight,
} from "@/lib/types/master-listing";

import StudioEngine from "../StudioEngine";

export default class AIManager {
  constructor(
    private readonly engine: StudioEngine,
  ) {}

  /**
   * Add AI Insight
   */
  add(
    insight: AIInsight,
  ) {
    this.engine.update({
      aiInsights: [
        ...this.engine.listing
          .aiInsights,
        insight,
      ],
    });

    this.engine.activity.record({
      type: "ai.insight.created",

      title: "AI Suggestion",

      description:
        insight.title,

      timestamp:
        new Date().toISOString(),

      metadata: {
        insightId:
          insight.id,
      },
    });
  }

  /**
   * Add Multiple Insights
   */
  addMany(
    insights: AIInsight[],
  ) {
    if (
      insights.length === 0
    ) {
      return;
    }

    this.engine.update({
      aiInsights: [
        ...this.engine.listing
          .aiInsights,
        ...insights,
      ],
    });

    this.engine.activity.record({
      type: "ai.batch.created",

      title:
        "AI Analysis Completed",

      description: `${insights.length} suggestions generated.`,

      timestamp:
        new Date().toISOString(),
    });
  }

  /**
   * Apply Insight
   */
  apply(
    insightId: string,
  ) {
    const updated =
      this.engine.listing.aiInsights.map(
        (insight) =>
          insight.id ===
          insightId
            ? {
                ...insight,

                applied: true,
              }
            : insight,
      );

    this.engine.update({
      aiInsights: updated,
    });

    const applied =
      updated.find(
        (item) =>
          item.id ===
          insightId,
      );

    this.engine.activity.record({
      type: "ai.insight.applied",

      title:
        "AI Suggestion Applied",

      description:
        applied?.title,

      timestamp:
        new Date().toISOString(),

      metadata: {
        insightId,
      },
    });
  }

  /**
   * Reject Insight
   */
  reject(
    insightId: string,
  ) {
    const updated =
      this.engine.listing.aiInsights.filter(
        (insight) =>
          insight.id !==
          insightId,
      );

    this.engine.update({
      aiInsights: updated,
    });

    this.engine.activity.record({
      type: "ai.insight.rejected",

      title:
        "AI Suggestion Rejected",

      timestamp:
        new Date().toISOString(),

      metadata: {
        insightId,
      },
    });
  }

  /**
   * Clear Applied
   */
  clearApplied() {
    const updated =
      this.engine.listing.aiInsights.filter(
        (insight) =>
          !insight.applied,
      );

    this.engine.update({
      aiInsights: updated,
    });
  }

  /**
   * Clear All
   */
  clear() {
    this.engine.update({
      aiInsights: [],
    });

    this.engine.activity.record({
      type: "ai.cleared",

      title:
        "AI Suggestions Cleared",

      timestamp:
        new Date().toISOString(),
    });
  }

  /**
   * Get Pending Insights
   */
  pending() {
    return this.engine.listing.aiInsights.filter(
      (insight) =>
        !insight.applied,
    );
  }

  /**
   * Get Applied Insights
   */
  applied() {
    return this.engine.listing.aiInsights.filter(
      (insight) =>
        insight.applied,
    );
  }

  /**
   * Count Pending
   */
  pendingCount() {
    return this.pending()
      .length;
  }

  /**
   * Count Applied
   */
  appliedCount() {
    return this.applied()
      .length;
  }

  /**
   * Find Insight
   */
  find(
    insightId: string,
  ) {
    return (
      this.engine.listing.aiInsights.find(
        (insight) =>
          insight.id ===
          insightId,
      ) ?? null
    );
  }
}