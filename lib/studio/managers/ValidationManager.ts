import { validateMasterListing } from "@/lib/domain/master-product/validate-master-listing";

import StudioEngine from "../StudioEngine";

export default class ValidationManager {
  private timer?: ReturnType<
    typeof setTimeout
  >;

  constructor(
    private readonly engine: StudioEngine,
  ) {}

  schedule(delay = 500) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      void this.run();
    }, delay);
  }

  async run() {
    this.engine.markValidating(true);

    try {
      const listing =
        this.engine.listing;
      const result =
        validateMasterListing(
          listing,
        );

      this.engine.draft.replaceValidation(
        result.issues,
      );
      this.engine.setValidationScore(
        result.score,
      );

      await this.engine.gateway.replaceValidationIssues(
        listing.id,
        result.issues,
      );

      return result;
    } finally {
      this.engine.markValidating(
        false,
      );
    }
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
