import { MarketplaceListing } from "@/lib/types/product";

export interface GetListingsRequest {
  productId: string;
}

export interface GetListingsResponse {
  items: MarketplaceListing[];
}