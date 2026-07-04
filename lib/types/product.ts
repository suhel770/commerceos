import { MarketplaceListing } from "./listing";

export interface Product {

  id: number;

  sku: string;

  name: string;

  category: string;

  image: string;

  costPrice: number;

  stock: number;

  sold30Days: number;

  listings: MarketplaceListing[];
}