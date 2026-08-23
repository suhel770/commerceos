"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/lib/types/product";

import type {
  AIInsight,
  MasterAttribute,
  MasterListing,
  MarketplaceName,
} from "@/lib/types/master-listing";

import StudioEngine from "@/lib/studio/StudioEngine";
import { httpMasterProductGateway } from "@/lib/gateways/http-master-product.gateway";

import type { StudioWorkspaceId } from "../config/studio.config";

export type StudioFieldInputType =
  | "text"
  | "number"
  | "textarea"
  | "select";

export interface StudioFieldEditorOptions {
  title: string;

  label?: string;

  value: string;

  description?: string;

  inputType?: StudioFieldInputType;

  options?: string[];

  marketplace?: string;

  onSave: (
    value: string,
  ) => void;
}

interface StudioContextType {
  /**
   * Legacy Product
   * (temporary compatibility)
   */
  product: Product;

  resetListing(): void;

  /**
   * New Studio Engine
   */
  engine: StudioEngine | null;

  /**
   * Master Listing
   */
  listing: MasterListing | null;

  /**
   * Engine Actions
   */
  refresh(): Promise<void>;

  validate(): Promise<void>;

  publish(
    marketplace?: MarketplaceName,
  ): Promise<void>;

  save(): Promise<void>;

  updateListing(
    updates: Partial<MasterListing>,
  ): void;

  updateAttribute(
    attribute: MasterAttribute,
  ): void;

  removeAttribute(
    key: string,
  ): void;

  addInsight(
    insight: AIInsight,
  ): void;

  /**
   * Workspace
   */
  activeWorkspace: StudioWorkspaceId;

  setActiveWorkspace: (
    workspace: StudioWorkspaceId,
  ) => void;

  /**
   * Studio State
   */
  dirty: boolean;

  saving: boolean;

  saveError: string | null;

  validating: boolean;

  publishing: boolean;

  loading: boolean;

  /**
   * Existing UI
   */
  setSaving(
    saving: boolean,
  ): void;

  setValidating(
    validating: boolean,
  ): void;

  fieldEditor:
    | StudioFieldEditorOptions
    | null;

  openFieldEditor(
    options: StudioFieldEditorOptions,
  ): void;

  closeFieldEditor(): void;
}

const StudioContext =
  createContext<StudioContextType | null>(
    null,
  );

interface StudioProviderProps {
  children: ReactNode;

  product: Product;
}
export function StudioProvider({
  children,
  product,
}: StudioProviderProps) {
  const [dirty, setDirty] =
    useState(false);

  const [saving, setSaving] =
    useState(false);
  const [
    saveError,
    setSaveError,
  ] = useState<string | null>(
    null,
  );

  const [
    validating,
    setValidating,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /**
   * ------------------------------------------------------------------
   * Studio Engine
   * ------------------------------------------------------------------
   */

  const engineRef =
    useRef<StudioEngine | null>(
      null,
    );

  const [
    engine,
    setEngine,
  ] =
    useState<StudioEngine | null>(
      null,
    );

  const [
    listing,
    setListing,
  ] =
    useState<MasterListing | null>(
      null,
    );

  /**
   * ------------------------------------------------------------------
   * Existing UI State
   * ------------------------------------------------------------------
   */

  const [
    fieldEditor,
    setFieldEditor,
  ] =
    useState<StudioFieldEditorOptions | null>(
      null,
    );

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] =
    useState<StudioWorkspaceId>(
      "overview",
    );

  /**
   * ------------------------------------------------------------------
   * Initialize Studio Engine
   * ------------------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);

      try {
        const masterListing =
          await httpMasterProductGateway.load(
            product,
          );

        if (!mounted) {
          return;
        }

        const engine =
          new StudioEngine(
            masterListing,
          );

        engineRef.current =
          engine;
        setEngine(engine);

        setListing(
          engine.listing,
        );

        setDirty(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const preventUnload = (
      event: BeforeUnloadEvent,
    ) => {
      event.preventDefault();
    };

    window.addEventListener(
      "beforeunload",
      preventUnload,
    );

    return () =>
      window.removeEventListener(
        "beforeunload",
        preventUnload,
      );
  }, [dirty]);

  /**
   * ------------------------------------------------------------------
   * Refresh Listing
   * ------------------------------------------------------------------
   */

  const refresh =
    useCallback(async () => {
      if (
        !engineRef.current
      ) {
        return;
      }

      const latest =
        await httpMasterProductGateway.reload(
          engineRef.current
            .listing.id,
        );

      if (!latest) {
        return;
      }

      engineRef.current
        .draft.replace(
          latest,
        );

      setListing(
        latest,
      );
      setDirty(false);
      setSaveError(null);
    }, []);

  /**
   * ------------------------------------------------------------------
   * Save
   * ------------------------------------------------------------------
   */

  const save =
    useCallback(async () => {
      if (
        !engineRef.current ||
        !engineRef.current.listing
          .permissions.canEdit
      ) {
        return;
      }

      setSaving(true);
      setSaveError(null);

      try {
        await engineRef.current.save();

        setListing(
          engineRef.current
            .listing,
        );

        setDirty(false);
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unable to save changes.",
        );
        throw error;
      } finally {
        setSaving(false);
      }
    }, []);

  /**
   * ------------------------------------------------------------------
   * Validate
   * ------------------------------------------------------------------
   */

  const validate =
    useCallback(async () => {
      if (
        !engineRef.current
      ) {
        return;
      }

      setValidating(true);

      try {
        await engineRef.current.validate();

        setListing(
          engineRef.current
            .listing,
        );
      } finally {
        setValidating(false);
      }
    }, []);

  /**
   * ------------------------------------------------------------------
   * Publish
   * ------------------------------------------------------------------
   */

  const publish =
    useCallback(
      async (
        marketplace?: MarketplaceName,
      ) => {
        if (
          !engineRef.current
        ) {
          return;
        }

        setPublishing(
          true,
        );

        try {
          await engineRef.current.publishTo(
            marketplace,
          );

          setListing(
            engineRef.current
              .listing,
          );
        } finally {
          setPublishing(
            false,
          );
        }
      },
      [],
    );
  const resetListing =
    useCallback(() => {
      setDirty(false);
      setSaveError(null);
      void refresh();
    }, [refresh]);

  /**
   * ------------------------------------------------------------------
   * Master Listing Updates
   * ------------------------------------------------------------------
   */

  const updateListing =
    useCallback(
      (
        updates: Partial<MasterListing>,
      ) => {
        if (
          !engineRef.current
        ) {
          return;
        }

        const current =
          engineRef.current.listing;

        if (
          !current.permissions.canEdit ||
          (updates.pricing &&
            !current.permissions
              .canManagePricing) ||
          (updates.inventory &&
            !current.permissions
              .canManageInventory)
        ) {
          return;
        }

        engineRef.current.update(
          updates,
        );

        setListing(
          engineRef.current.listing,
        );

        setDirty(true);
        setSaveError(null);
      },
      [],
    );

  const updateAttribute =
    useCallback(
      (
        attribute: MasterAttribute,
      ) => {
        if (
          !engineRef.current ||
          !engineRef.current.listing
            .permissions.canEdit
        ) {
          return;
        }

        engineRef.current.updateAttribute(
          attribute,
        );

        setListing(
          engineRef.current.listing,
        );

        setDirty(true);
      },
      [],
    );

  const removeAttribute =
    useCallback(
      (
        key: string,
      ) => {
        if (
          !engineRef.current ||
          !engineRef.current.listing
            .permissions.canEdit
        ) {
          return;
        }

        engineRef.current.draft.removeAttribute(
          key,
        );

        setListing(
          engineRef.current.listing,
        );

        setDirty(true);
      },
      [],
    );

  /**
   * ------------------------------------------------------------------
   * AI
   * ------------------------------------------------------------------
   */

  const addInsight =
    useCallback(
      (
        insight: AIInsight,
      ) => {
        if (
          !engineRef.current
        ) {
          return;
        }

        engineRef.current.updateAIInsight(
          insight,
        );

        setListing(
          engineRef.current.listing,
        );
      },
      [],
    );

  /**
   * ------------------------------------------------------------------
   * Field Editor
   * ------------------------------------------------------------------
   */

  const openFieldEditor =
    useCallback(
      (
        options: StudioFieldEditorOptions,
      ) => {
        setFieldEditor(
          options,
        );
      },
      [],
    );

  const closeFieldEditor =
    useCallback(() => {
      setFieldEditor(
        null,
      );
    }, []);

  /**
   * ------------------------------------------------------------------
   * Context Value
   * ------------------------------------------------------------------
   */

  const value =
    useMemo(
      () => ({
        product,
        resetListing,

        /**
         * Studio Engine
         */
        engine,

        listing,

        refresh,

        validate,

        publish,

        save,

        updateListing,

        updateAttribute,

        removeAttribute,

        addInsight,

        /**
         * Workspace
         */
        activeWorkspace,

        setActiveWorkspace,

        /**
         * State
         */
        dirty,

        saving,

        saveError,

        validating,

        publishing,

        loading,

        /**
         * UI
         */
        setSaving,

        setValidating,

        fieldEditor,

        openFieldEditor,

        closeFieldEditor,
      }),
      [
        product,
        engine,
        listing,
        activeWorkspace,
        dirty,
        saving,
        saveError,
        validating,
        publishing,
        loading,
        fieldEditor,
        refresh,
        validate,
        publish,
        save,
        updateListing,
        updateAttribute,
        removeAttribute,
        addInsight,
        resetListing,
        openFieldEditor,
        closeFieldEditor,
      ],
    );

  return (
    <StudioContext.Provider
      value={value}
    >
      {children}
    </StudioContext.Provider>
  );
}

/**
 * ------------------------------------------------------------------
 * Hook
 * ------------------------------------------------------------------
 */

export function useStudio() {
  const context =
    useContext(
      StudioContext,
    );

  if (!context) {
    throw new Error(
      "useStudio must be used inside StudioProvider.",
    );
  }

  return context;
}

