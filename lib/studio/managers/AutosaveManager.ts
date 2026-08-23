import StudioEngine from "../StudioEngine";

export default class AutosaveManager {
  private timer?: ReturnType<
    typeof setTimeout
  >;

  private readonly debounce =
    2000;
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(
    private readonly engine: StudioEngine,
  ) {}

  /**
   * Schedule Autosave
   */
  schedule() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      void this.saveNow().catch(
        () => undefined,
      );
    }, this.debounce);
  }

  /**
   * Cancel Pending Save
   */
  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Force Save
   */
  async saveNow() {
    this.cancel();

    if (
      !this.engine.snapshot.dirty
    ) {
      return this.engine.listing;
    }

    this.engine.markSaving(
      true,
    );

    try {
      const listing =
        await this.engine.gateway.saveDraft(
          this.engine.listing,
        );

      this.engine.replaceListing(
        listing,
      );

      this.engine.markDirty(
        false,
      );

      this.engine.setLastSaved(
        new Date().toISOString(),
      );
      this.retryCount = 0;

      this.engine.activity.record({
        type: "draft.saved",

        title: "Draft Saved",

        description:
          "Product draft saved successfully.",

        timestamp:
          new Date().toISOString(),
      });

      return listing;
    } catch (error) {
      this.engine.activity.record({
        type: "draft.failed",

        title: "Draft Save Failed",

        description:
          error instanceof Error
            ? error.message
            : "Unknown error.",

        timestamp:
          new Date().toISOString(),
      });

      if (
        this.retryCount <
        this.maxRetries
      ) {
        this.retryCount += 1;
        this.timer = setTimeout(
          () => {
            void this.saveNow().catch(
              () => undefined,
            );
          },
          1000 *
            2 ** this.retryCount,
        );
      }

      throw error;
    } finally {
      this.engine.markSaving(
        false,
      );
    }
  }

  /**
   * Flush Pending Save
   */
  async flush() {
    return this.saveNow();
  }

  /**
   * Whether a save is waiting
   */
  get pending() {
    return (
      this.timer !== undefined
    );
  }

  /**
   * Dispose manager
   */
  dispose() {
    this.cancel();
  }
}