"use client"

import { useCallback, useEffect, useState } from "react"

import masterListingApi from "@/lib/api/masterListing"

import {
  AIInsight,
  MarketplaceName,
  MasterAttribute,
  MasterListing,
} from "@/lib/types/master-listing"

interface UseMasterListingResult {
  listing: MasterListing | null
  loading: boolean
  error: string | null

  refresh(): Promise<void>

  validate(): Promise<void>

  publish(
    marketplace?: MarketplaceName,
  ): Promise<void>

  update(
    updates: Partial<MasterListing>,
  ): Promise<void>

  updatePricing(
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ): Promise<void>

  updateInventory(
    quantity: number,
  ): Promise<void>

  upsertAttribute(
    attribute: MasterAttribute,
  ): Promise<void>

  removeAttribute(
    key: string,
  ): Promise<void>

  addInsight(
    insight: AIInsight,
  ): Promise<void>

  applyInsight(
    insightId: string,
  ): Promise<void>

  archive(): Promise<void>

  remove(): Promise<void>
}

export function useMasterListing(
  listingId: string,
): UseMasterListingResult {
  const [listing, setListing] =
    useState<MasterListing | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)

      const data =
        await masterListingApi.getById(
          listingId,
        )

      if (!data) {
        setError("Listing not found.")
        setListing(null)
        return
      }

      setListing(data)
      setError(null)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      )
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    // Mount/reload fetch for the master listing client hook.
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [refresh])

  const update = async (
    updates: Partial<MasterListing>,
  ) => {
    await masterListingApi.update(
      listingId,
      updates,
    )

    await refresh()
  }

  const validate = async () => {
    await masterListingApi.validate(
      listingId,
    )

    await refresh()
  }

  const publish = async (
    marketplace?: MarketplaceName,
  ) => {
    await masterListingApi.publish(
      listingId,
      marketplace,
    )

    await refresh()
  }

  const updatePricing = async (
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ) => {
    await masterListingApi.updatePricing(
      listingId,
      sellingPrice,
      mrp,
      costPrice,
    )

    await refresh()
  }

  const updateInventory = async (
    quantity: number,
  ) => {
    await masterListingApi.updateInventory(
      listingId,
      quantity,
    )

    await refresh()
  }

  const upsertAttribute = async (
    attribute: MasterAttribute,
  ) => {
    await masterListingApi.upsertAttribute(
      listingId,
      attribute,
    )

    await refresh()
  }

  const removeAttribute = async (
    key: string,
  ) => {
    await masterListingApi.removeAttribute(
      listingId,
      key,
    )

    await refresh()
  }

  const addInsight = async (
    insight: AIInsight,
  ) => {
    await masterListingApi.addAIInsight(
      listingId,
      insight,
    )

    await refresh()
  }

  const applyInsight = async (
    insightId: string,
  ) => {
    await masterListingApi.markInsightApplied(
      listingId,
      insightId,
    )

    await refresh()
  }

  const archive = async () => {
    await masterListingApi.archive(
      listingId,
    )

    await refresh()
  }

  const remove = async () => {
    await masterListingApi.delete(
      listingId,
    )

    setListing(null)
  }

  return {
    listing,
    loading,
    error,

    refresh,

    validate,

    publish,

    update,

    updatePricing,

    updateInventory,

    upsertAttribute,

    removeAttribute,

    addInsight,

    applyInsight,

    archive,

    remove,
  }
}

export default useMasterListing