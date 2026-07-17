"use client";

import { useStudio } from "@/components/products/studio/context/StudioContext";

import type { Product } from "@/lib/types/product";

type ProductField = keyof Product;

export function useField(
    field: ProductField
) {

    const {
        draft,
        updateDraft,
    } = useStudio();

    return {

        value:
            draft[field],

        setValue(
            value: Product[
                ProductField
            ]
        ) {

            updateDraft({
                [field]: value,
            });

        },

    };

}