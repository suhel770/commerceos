import type {
  AIInsight,
  MasterAttribute,
  MasterListing,
  MarketplaceName,
} from "@/lib/types/master-listing";

import DraftManager from "./managers/DraftManager";
import ValidationManager from "./managers/ValidationManager";
import AutosaveManager from "./managers/AutosaveManager";
import PublishManager from "./managers/PublishManager";
import HistoryManager from "./managers/HistoryManager";
import ActivityManager from "./managers/ActivityManager";
import AIManager from "./managers/AIManager";
import type { MasterProductGateway } from "@/lib/gateways/master-product.gateway";
import { httpMasterProductGateway } from "@/lib/gateways/http-master-product.gateway";

export interface StudioEngineState {
  listing: MasterListing;

  dirty: boolean;

  saving: boolean;

  validating: boolean;

  publishing: boolean;

  loading: boolean;

  lastSavedAt?: string;

  validationScore?: number;

  publishScore?: number;
}

export default class StudioEngine {
  readonly draft: DraftManager;

  readonly validation: ValidationManager;

  readonly autosave: AutosaveManager;

  readonly publish: PublishManager;

  readonly history: HistoryManager;

  readonly activity: ActivityManager;

  readonly ai: AIManager;

  readonly gateway: MasterProductGateway;

  private state: StudioEngineState;

  constructor(
    listing: MasterListing,
    gateway: MasterProductGateway =
      httpMasterProductGateway,
  ) {
    this.state = {
      listing,
      dirty: false,
      saving: false,
      validating: false,
      publishing: false,
      loading: false,
    };
    this.gateway = gateway;

    this.draft =
      new DraftManager(this);

    this.validation =
      new ValidationManager(this);

    this.autosave =
      new AutosaveManager(this);

    this.publish =
      new PublishManager(this);

    this.history =
      new HistoryManager(this);

    this.activity =
      new ActivityManager();

    this.ai =
      new AIManager(this);
  }

  get listing() {
    return this.state.listing;
  }

  get snapshot() {
    return this.state;
  }

  update(
    updates: Partial<MasterListing>,
  ) {
    this.history.capture(
      this.state.listing,
    );

    this.state = {
      ...this.state,

      listing: {
        ...this.state.listing,

        ...updates,
      },

      dirty: true,
    };

    this.autosave.schedule();

    this.validation.schedule();
  }

  updateAttribute(
    attribute: MasterAttribute,
  ) {
    this.draft.updateAttribute(
      attribute,
    );
  }

  updateAIInsight(
    insight: AIInsight,
  ) {
    this.ai.add(insight);
  }

  async validate() {
    return this.validation.run();
  }

  async publishTo(
    marketplace?: MarketplaceName,
  ) {
    return this.publish.publish(
      marketplace,
    );
  }

  async save() {
    return this.autosave.saveNow();
  }

  markSaving(
    saving: boolean,
  ) {
    this.state.saving = saving;
  }

  markValidating(
    validating: boolean,
  ) {
    this.state.validating =
      validating;
  }

  markPublishing(
    publishing: boolean,
  ) {
    this.state.publishing =
      publishing;
  }

  markDirty(
    dirty: boolean,
  ) {
    this.state.dirty = dirty;
  }

  replaceListing(
    listing: MasterListing,
  ) {
    this.state.listing =
      listing;
  }

  setLastSaved(
    date: string,
  ) {
    this.state.lastSavedAt =
      date;
  }

  setValidationScore(
    score: number,
  ) {
    this.state.validationScore =
      score;
  }

  setPublishScore(
    score: number,
  ) {
    this.state.publishScore =
      score;
  }
}