"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/lib/types/product";

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

  onSave: (value: string) => void;
}

interface StudioContextType {
  /**
   * Original product (Read Only)
   */
  product: Product;

  /**
   * Editable Draft
   */
  draft: Product;

  /**
   * Update Draft
   */
  updateDraft: (
    updates: Partial<Product>
  ) => void;

  /**
   * Replace Draft
   */
  replaceDraft: (
    product: Product
  ) => void;

  /**
   * Reset Draft
   */
  resetDraft: () => void;

  /**
   * Active Workspace
   */
  activeWorkspace: StudioWorkspaceId;

  setActiveWorkspace: (
    workspace: StudioWorkspaceId
  ) => void;

  /**
   * UI State
   */
  dirty: boolean;

  saving: boolean;

  validating: boolean;

  setSaving: (
    saving: boolean
  ) => void;

  setValidating: (
    validating: boolean
  ) => void;

  fieldEditor: StudioFieldEditorOptions | null;

  openFieldEditor: (
    options: StudioFieldEditorOptions
  ) => void;

  closeFieldEditor: () => void;
}

const StudioContext =
  createContext<StudioContextType | null>(
    null
  );

interface StudioProviderProps {
  children: ReactNode;

  product: Product;
}

export function StudioProvider({
  children,
  product,
}: StudioProviderProps) {
  const [draft, setDraft] =
    useState<Product>(product);

  const [dirty, setDirty] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    validating,
    setValidating,
  ] = useState(false);

  const [
    fieldEditor,
    setFieldEditor,
  ] =
    useState<StudioFieldEditorOptions | null>(
      null
    );

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] =
    useState<StudioWorkspaceId>(
      "overview"
    );

  const updateDraft =
    useCallback(
      (
        updates: Partial<Product>
      ) => {
        setDraft((previous) => ({
          ...previous,
          ...updates,
        }));

        setDirty(true);

        /**
         * Future
         *
         * Validation
         * Autosave
         * AI Analysis
         * Activity
         */
      },
      []
    );

  const replaceDraft =
    useCallback(
      (
        nextProduct: Product
      ) => {
        setDraft(nextProduct);

        setDirty(false);
      },
      []
    );

  const resetDraft =
    useCallback(() => {
      setDraft(product);

      setDirty(false);
    }, [product]);

  const openFieldEditor =
    useCallback(
      (
        options: StudioFieldEditorOptions
      ) => {
        setFieldEditor(options);
      },
      []
    );

  const closeFieldEditor =
    useCallback(() => {
      setFieldEditor(null);
    }, []);

  const value =
    useMemo(
      () => ({
        product,

        draft,

        updateDraft,

        replaceDraft,

        resetDraft,

        activeWorkspace,

        setActiveWorkspace,

        dirty,

        saving,

        validating,

        setSaving,

        setValidating,

        fieldEditor,

        openFieldEditor,

        closeFieldEditor,
      }),
      [
        product,

        draft,

        activeWorkspace,

        dirty,

        saving,

        validating,

        fieldEditor,

        updateDraft,

        replaceDraft,

        resetDraft,

        openFieldEditor,

        closeFieldEditor,
      ]
    );

  return (
    <StudioContext.Provider
      value={value}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context =
    useContext(StudioContext);

  if (!context) {
    throw new Error(
      "useStudio must be used inside StudioProvider."
    );
  }

  return context;
}
