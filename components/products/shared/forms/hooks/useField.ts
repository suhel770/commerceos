"use client";

import { useStudio } from "@/components/products/studio/context/StudioContext";

import type { Product } from "@/lib/types/product";

type ProductField = keyof Product;

export function useField(field?: ProductField) {

    const {
        draft,
        updateDraft,
    } = useStudio();

    return {

        value: field ? draft[field] : undefined,

        setValue(
            value: Product[
                ProductField
            ]
        ) {

            if (!field) return;

            updateDraft({
                [field]: value,
            });

        },

    };

}
