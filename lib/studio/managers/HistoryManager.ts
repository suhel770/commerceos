import type {
  MasterListing,
} from "@/lib/types/master-listing";

import StudioEngine from "../StudioEngine";

export interface HistoryEntry {
  id: string;

  timestamp: string;

  snapshot: MasterListing;
}

export default class HistoryManager {
  private readonly maxEntries =
    100;

  private undoStack: HistoryEntry[] =
    [];

  private redoStack: HistoryEntry[] =
    [];

  constructor(
    private readonly engine: StudioEngine,
  ) {}

  /**
   * Capture current state before mutation.
   */
  capture(
    listing: MasterListing,
  ) {
    this.undoStack.push({
      id: crypto.randomUUID(),

      timestamp:
        new Date().toISOString(),

      snapshot:
        structuredClone(
          listing,
        ),
    });

    if (
      this.undoStack.length >
      this.maxEntries
    ) {
      this.undoStack.shift();
    }

    /**
     * New edits invalidate redo history.
     */
    this.redoStack = [];
  }

  /**
   * Undo
   */
  undo() {
    if (
      this.undoStack.length ===
      0
    ) {
      return null;
    }

    const current =
      structuredClone(
        this.engine.listing,
      );

    this.redoStack.push({
      id: crypto.randomUUID(),

      timestamp:
        new Date().toISOString(),

      snapshot: current,
    });

    const previous =
      this.undoStack.pop()!;

    this.engine.replaceListing(
      structuredClone(
        previous.snapshot,
      ),
    );

    this.engine.markDirty(
      true,
    );

    this.engine.activity.record({
      type: "history.undo",

      title: "Undo",

      description:
        "Previous change restored.",

      timestamp:
        new Date().toISOString(),
    });

    return previous.snapshot;
  }

  /**
   * Redo
   */
  redo() {
    if (
      this.redoStack.length ===
      0
    ) {
      return null;
    }

    const current =
      structuredClone(
        this.engine.listing,
      );

    this.undoStack.push({
      id: crypto.randomUUID(),

      timestamp:
        new Date().toISOString(),

      snapshot: current,
    });

    const next =
      this.redoStack.pop()!;

    this.engine.replaceListing(
      structuredClone(
        next.snapshot,
      ),
    );

    this.engine.markDirty(
      true,
    );

    this.engine.activity.record({
      type: "history.redo",

      title: "Redo",

      description:
        "Change reapplied.",

      timestamp:
        new Date().toISOString(),
    });

    return next.snapshot;
  }

  /**
   * Remove all history.
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Current history state.
   */
  get state() {
    return {
      canUndo:
        this.undoStack.length > 0,

      canRedo:
        this.redoStack.length > 0,

      undoCount:
        this.undoStack.length,

      redoCount:
        this.redoStack.length,
    };
  }

  /**
   * Export history.
   */
  export() {
    return {
      undo:
        structuredClone(
          this.undoStack,
        ),

      redo:
        structuredClone(
          this.redoStack,
        ),
    };
  }

  /**
   * Restore history.
   */
  import(history: {
    undo: HistoryEntry[];
    redo: HistoryEntry[];
  }) {
    this.undoStack =
      structuredClone(
        history.undo,
      );

    this.redoStack =
      structuredClone(
        history.redo,
      );
  }
}