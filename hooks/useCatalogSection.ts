"use client";

import { useCallback, useMemo, useState } from "react";

interface UseCatalogSectionOptions<T extends Record<string, unknown>> {
  initialValues: T;
}

export function useCatalogSection<
  T extends Record<string, unknown>,
>({
  initialValues,
}: UseCatalogSectionOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);

  const updateField = useCallback(
    (fieldId: string, value: unknown) => {
      setValues((previous) => ({
        ...previous,
        [fieldId]: value,
      }));
    },
    []
  );

  const updateFields = useCallback(
    (newValues: Partial<T>) => {
      setValues((previous) => ({
        ...previous,
        ...newValues,
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(values) !==
      JSON.stringify(initialValues)
    );
  }, [values, initialValues]);

  return {
    values,

    dirty,

    updateField,

    updateFields,

    reset,
  };
}