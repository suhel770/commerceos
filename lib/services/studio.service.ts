import type { Product } from "@/lib/types/product";

/**
 * Studio Service
 *
 * This service is the ONLY layer allowed
 * to communicate with backend APIs for
 * Product Studio.
 *
 * Today:
 * Mock implementation
 *
 * Future:
 * REST API
 * GraphQL
 * WebSocket
 */

export class StudioService {
  /**
   * Save Draft
   */
  static async saveDraft(
    product: Product
  ): Promise<Product> {
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    return product;
  }

  /**
   * Validate Product
   */
  static async validate(
    product: Product
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

    return {
      valid: true,
      score: 96,
      issues: [],
    };
  }

  /**
   * AI Analysis
   */
  static async analyse(
    product: Product
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    return {
      seoScore: 92,

      marketplaceScore: 95,

      suggestions: [],
    };
  }

  /**
   * Publish
   */
  static async publish() {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    return {
      success: true,
    };
  }
}