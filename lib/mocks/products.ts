import type { Product } from "@/lib/types/product";

export const products: Product[] = [

  {
    id: "prd_001",

    slug: "lilwalk-dino-clogs",

    sku: "LW-001",

    image: "/products/lw-dino.png",

    name: "LilWalk Dino Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 152,
      reserved: 12,
      incoming: 40,
    },

    pricing: {
      costPrice: 350,
      sellingPrice: 699,
      mrp: 999,
      profit: 349,
      margin: 49.9,
    },

    performance: {
      ordersToday: 24,
      revenueToday: 16776,
      returnsPercentage: 1.2,
      healthScore: 96,
    },

    aiRecommendations: [
      {
        id: "ai-001",
        type: "pricing",
        priority: "medium",
        message:
          "Increase Amazon selling price by ₹20 to improve monthly profit.",
      },
      {
        id: "ai-002",
        type: "inventory",
        priority: "low",
        message:
          "Current inventory is healthy for the next 18 days.",
      },
    ],

    listings: [

      {
        id: "lst-amz-001",

        marketplace: "Amazon",

        title: "LilWalk Dino Clogs",

        marketplaceSku: "LW001-AMZ",

        listingIdLabel: "ASIN",

        listingId: "B0LW001A",

        sellingPrice: 699,

        availableStock: 126,

        orders30Days: 132,

        revenue30Days: 92268,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "2 min ago",

        healthScore: 98,

        marketplaceUrl: "#",
      },

      {
        id: "lst-flk-001",

        marketplace: "Flipkart",

        title: "LilWalk Dino Clogs",

        marketplaceSku: "LW001-FK",

        listingIdLabel: "FSN",

        listingId: "FSN001LW",

        sellingPrice: 699,

        availableStock: 98,

        orders30Days: 84,

        revenue30Days: 58716,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "5 min ago",

        healthScore: 95,

        marketplaceUrl: "#",
      },

      {
        id: "lst-mee-001",

        marketplace: "Meesho",

        title: "LilWalk Dino Clogs",

        marketplaceSku: "LW001-MS",

        listingIdLabel: "Product ID",

        listingId: "MSH458921",

        sellingPrice: 689,

        availableStock: 62,

        orders30Days: 53,

        revenue30Days: 36517,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "8 min ago",

        healthScore: 92,

        marketplaceUrl: "#",
      },

      {
        id: "lst-shp-001",

        marketplace: "Shopify",

        title: "LilWalk Dino Clogs",

        marketplaceSku: "LW001-SP",

        listingIdLabel: "Handle",

        listingId: "lilwalk-dino-clogs",

        sellingPrice: 699,

        availableStock: 41,

        orders30Days: 27,

        revenue30Days: 18873,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "1 min ago",

        healthScore: 100,

        marketplaceUrl: "#",
      },

      {
        id: "lst-web-001",

        marketplace: "Own Website",

        title: "LilWalk Dino Clogs",

        marketplaceSku: "LW001-WEB",

        listingIdLabel: "Product",

        listingId: "LW-DINO-001",

        sellingPrice: 699,

        availableStock: 36,

        orders30Days: 18,

        revenue30Days: 12582,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "Just now",

        healthScore: 99,

        marketplaceUrl: "#",
      },

    ],

    createdAt: "2026-07-01",

    updatedAt: "2026-07-12",
  },
    {
    id: "prd_002",

    slug: "lilwalk-panda-clogs",

    sku: "LW-002",

    image: "/products/lw-panda.png",

    name: "LilWalk Panda Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 84,
      reserved: 6,
      incoming: 20,
    },

    pricing: {
      costPrice: 370,
      sellingPrice: 749,
      mrp: 999,
      profit: 379,
      margin: 50.6,
    },

    performance: {
      ordersToday: 18,
      revenueToday: 13482,
      returnsPercentage: 1.6,
      healthScore: 94,
    },

    aiRecommendations: [
      {
        id: "ai-003",
        type: "pricing",
        priority: "low",
        message:
          "Current pricing is performing well.",
      },
    ],

    listings: [

      {
        id: "lst-amz-002",

        marketplace: "Amazon",

        title: "LilWalk Panda Clogs",

        marketplaceSku: "LW002-AMZ",

        listingIdLabel: "ASIN",

        listingId: "B0LW002A",

        sellingPrice: 749,

        availableStock: 42,

        orders30Days: 76,

        revenue30Days: 56924,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "3 min ago",

        healthScore: 96,

        marketplaceUrl: "#",
      },

      {
        id: "lst-flk-002",

        marketplace: "Flipkart",

        title: "LilWalk Panda Clogs",

        marketplaceSku: "LW002-FK",

        listingIdLabel: "FSN",

        listingId: "FSN002LW",

        sellingPrice: 749,

        availableStock: 28,

        orders30Days: 48,

        revenue30Days: 35952,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "6 min ago",

        healthScore: 93,

        marketplaceUrl: "#",
      },

      {
        id: "lst-web-002",

        marketplace: "Own Website",

        title: "LilWalk Panda Clogs",

        marketplaceSku: "LW002-WEB",

        listingIdLabel: "Product",

        listingId: "LW-PANDA-002",

        sellingPrice: 749,

        availableStock: 14,

        orders30Days: 16,

        revenue30Days: 11984,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "Just now",

        healthScore: 98,

        marketplaceUrl: "#",
      },

    ],

    createdAt: "2026-07-02",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_003",

    slug: "lilwalk-shark-clogs",

    sku: "LW-003",

    image: "/products/lw-shark.png",

    name: "LilWalk Shark Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 41,
      reserved: 4,
      incoming: 60,
    },

    pricing: {
      costPrice: 395,
      sellingPrice: 799,
      mrp: 1099,
      profit: 404,
      margin: 50.6,
    },

    performance: {
      ordersToday: 11,
      revenueToday: 8789,
      returnsPercentage: 2.1,
      healthScore: 92,
    },

    aiRecommendations: [
      {
        id: "ai-004",
        type: "inventory",
        priority: "medium",
        message:
          "Incoming stock will arrive in 3 days.",
      },
    ],

    listings: [

      {
        id: "lst-amz-003",

        marketplace: "Amazon",

        title: "LilWalk Shark Clogs",

        marketplaceSku: "LW003-AMZ",

        listingIdLabel: "ASIN",

        listingId: "B0LW003A",

        sellingPrice: 799,

        availableStock: 18,

        orders30Days: 39,

        revenue30Days: 31161,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "5 min ago",

        healthScore: 95,

        marketplaceUrl: "#",
      },

      {
        id: "lst-shp-003",

        marketplace: "Shopify",

        title: "LilWalk Shark Clogs",

        marketplaceSku: "LW003-SP",

        listingIdLabel: "Handle",

        listingId: "lilwalk-shark-clogs",

        sellingPrice: 799,

        availableStock: 9,

        orders30Days: 15,

        revenue30Days: 11985,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "2 min ago",

        healthScore: 100,

        marketplaceUrl: "#",
      },

      {
        id: "lst-web-003",

        marketplace: "Own Website",

        title: "LilWalk Shark Clogs",

        marketplaceSku: "LW003-WEB",

        listingIdLabel: "Product",

        listingId: "LW-SHARK-003",

        sellingPrice: 799,

        availableStock: 14,

        orders30Days: 10,

        revenue30Days: 7990,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "Just now",

        healthScore: 99,

        marketplaceUrl: "#",
      },

    ],

    createdAt: "2026-07-03",

    updatedAt: "2026-07-12",
  },
    {
    id: "prd_004",

    slug: "lilwalk-unicorn-clogs",

    sku: "LW-004",

    image: "/products/lw-unicorn.png",

    name: "LilWalk Unicorn Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 218,
      reserved: 15,
      incoming: 80,
    },

    pricing: {
      costPrice: 390,
      sellingPrice: 799,
      mrp: 1099,
      profit: 409,
      margin: 51.2,
    },

    performance: {
      ordersToday: 31,
      revenueToday: 24769,
      returnsPercentage: 0.8,
      healthScore: 99,
    },

    aiRecommendations: [
      {
        id: "ai-005",
        type: "marketing",
        priority: "medium",
        message:
          "Increase advertising budget by 15% to maximize sales.",
      },
    ],

    listings: [

      {
        id: "lst-amz-004",

        marketplace: "Amazon",

        title: "LilWalk Unicorn Clogs",

        marketplaceSku: "LW004-AMZ",

        listingIdLabel: "ASIN",

        listingId: "B0LW004A",

        sellingPrice: 799,

        availableStock: 92,

        orders30Days: 148,

        revenue30Days: 118252,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "1 min ago",

        healthScore: 99,

        marketplaceUrl: "#",
      },

      {
        id: "lst-flk-004",

        marketplace: "Flipkart",

        title: "LilWalk Unicorn Clogs",

        marketplaceSku: "LW004-FK",

        listingIdLabel: "FSN",

        listingId: "FSN004LW",

        sellingPrice: 799,

        availableStock: 54,

        orders30Days: 92,

        revenue30Days: 73508,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "3 min ago",

        healthScore: 97,

        marketplaceUrl: "#",
      },

      {
        id: "lst-mee-004",

        marketplace: "Meesho",

        title: "LilWalk Unicorn Clogs",

        marketplaceSku: "LW004-MS",

        listingIdLabel: "Product ID",

        listingId: "MSH004LW",

        sellingPrice: 789,

        availableStock: 38,

        orders30Days: 56,

        revenue30Days: 44184,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "6 min ago",

        healthScore: 95,

        marketplaceUrl: "#",
      },

      {
        id: "lst-shp-004",

        marketplace: "Shopify",

        title: "LilWalk Unicorn Clogs",

        marketplaceSku: "LW004-SP",

        listingIdLabel: "Handle",

        listingId: "lilwalk-unicorn-clogs",

        sellingPrice: 799,

        availableStock: 21,

        orders30Days: 33,

        revenue30Days: 26367,

        status: "Active",

        listingStatus: "Live",

        stockSync: true,

        lastSync: "Just now",

        healthScore: 100,

        marketplaceUrl: "#",
      },

    ],

    createdAt: "2026-07-04",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_005",

    slug: "lilwalk-space-clogs",

    sku: "LW-005",

    image: "/products/lw-space.png",

    name: "LilWalk Space Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Draft",

    inventory: {
      available: 0,
      reserved: 0,
      incoming: 300,
    },

    pricing: {
      costPrice: 410,
      sellingPrice: 849,
      mrp: 1199,
      profit: 439,
      margin: 51.7,
    },

    performance: {
      ordersToday: 0,
      revenueToday: 0,
      returnsPercentage: 0,
      healthScore: 0,
    },

    aiRecommendations: [
      {
        id: "ai-006",
        type: "listing",
        priority: "high",
        message:
          "Publish this product on Amazon and Flipkart.",
      },
    ],

    listings: [],

    createdAt: "2026-07-10",

    updatedAt: "2026-07-12",
  },
    {
    id: "prd_006",

    slug: "lilwalk-rainbow-clogs",

    sku: "LW-006",

    image: "/products/lw-rainbow.png",

    name: "LilWalk Rainbow Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 65,
      reserved: 8,
      incoming: 120,
    },

    pricing: {
      costPrice: 360,
      sellingPrice: 729,
      mrp: 999,
      profit: 369,
      margin: 50.6,
    },

    performance: {
      ordersToday: 19,
      revenueToday: 13851,
      returnsPercentage: 1.4,
      healthScore: 95,
    },

    aiRecommendations: [
      {
        id: "ai-007",
        type: "inventory",
        priority: "low",
        message: "Healthy inventory maintained.",
      },
    ],

    listings: [],

    createdAt: "2026-07-05",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_007",

    slug: "lilwalk-racing-clogs",

    sku: "LW-007",

    image: "/products/lw-racing.png",

    name: "LilWalk Racing Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Out of Stock",

    inventory: {
      available: 0,
      reserved: 0,
      incoming: 220,
    },

    pricing: {
      costPrice: 385,
      sellingPrice: 799,
      mrp: 1099,
      profit: 414,
      margin: 51.8,
    },

    performance: {
      ordersToday: 0,
      revenueToday: 0,
      returnsPercentage: 1.8,
      healthScore: 71,
    },

    aiRecommendations: [
      {
        id: "ai-008",
        type: "inventory",
        priority: "high",
        message: "Restock immediately to prevent sales loss.",
      },
    ],

    listings: [],

    createdAt: "2026-07-06",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_008",

    slug: "lilwalk-princess-clogs",

    sku: "LW-008",

    image: "/products/lw-princess.png",

    name: "LilWalk Princess Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 192,
      reserved: 11,
      incoming: 60,
    },

    pricing: {
      costPrice: 420,
      sellingPrice: 849,
      mrp: 1199,
      profit: 429,
      margin: 50.5,
    },

    performance: {
      ordersToday: 27,
      revenueToday: 22923,
      returnsPercentage: 0.9,
      healthScore: 98,
    },

    aiRecommendations: [
      {
        id: "ai-009",
        type: "marketing",
        priority: "medium",
        message: "High demand detected. Increase ad budget.",
      },
    ],

    listings: [],

    createdAt: "2026-07-06",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_009",

    slug: "lilwalk-football-clogs",

    sku: "LW-009",

    image: "/products/lw-football.png",

    name: "LilWalk Football Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Inactive",

    inventory: {
      available: 48,
      reserved: 5,
      incoming: 0,
    },

    pricing: {
      costPrice: 375,
      sellingPrice: 749,
      mrp: 999,
      profit: 374,
      margin: 49.9,
    },

    performance: {
      ordersToday: 3,
      revenueToday: 2247,
      returnsPercentage: 4.3,
      healthScore: 79,
    },

    aiRecommendations: [
      {
        id: "ai-010",
        type: "listing",
        priority: "medium",
        message: "Reactivate listing to resume sales.",
      },
    ],

    listings: [],

    createdAt: "2026-07-07",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_010",

    slug: "lilwalk-space-rocket-clogs",

    sku: "LW-010",

    image: "/products/lw-space-rocket.png",

    name: "LilWalk Space Rocket Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 139,
      reserved: 14,
      incoming: 75,
    },

    pricing: {
      costPrice: 430,
      sellingPrice: 899,
      mrp: 1299,
      profit: 469,
      margin: 52.2,
    },

    performance: {
      ordersToday: 34,
      revenueToday: 30566,
      returnsPercentage: 1.1,
      healthScore: 99,
    },

    aiRecommendations: [
      {
        id: "ai-011",
        type: "pricing",
        priority: "low",
        message: "Current pricing is performing exceptionally well.",
      },
    ],

    listings: [],

    createdAt: "2026-07-08",

    updatedAt: "2026-07-12",
  },
    {
    id: "prd_011",

    slug: "lilwalk-monster-clogs",

    sku: "LW-011",

    image: "/products/lw-monster.png",

    name: "LilWalk Monster Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 76,
      reserved: 7,
      incoming: 55,
    },

    pricing: {
      costPrice: 365,
      sellingPrice: 749,
      mrp: 999,
      profit: 384,
      margin: 51.3,
    },

    performance: {
      ordersToday: 21,
      revenueToday: 15729,
      returnsPercentage: 1.3,
      healthScore: 95,
    },

    aiRecommendations: [],

    listings: [],

    createdAt: "2026-07-09",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_012",

    slug: "lilwalk-fire-clogs",

    sku: "LW-012",

    image: "/products/lw-fire.png",

    name: "LilWalk Fire Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 102,
      reserved: 9,
      incoming: 40,
    },

    pricing: {
      costPrice: 390,
      sellingPrice: 799,
      mrp: 1099,
      profit: 409,
      margin: 51.2,
    },

    performance: {
      ordersToday: 25,
      revenueToday: 19975,
      returnsPercentage: 1.7,
      healthScore: 93,
    },

    aiRecommendations: [],

    listings: [],

    createdAt: "2026-07-09",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_013",

    slug: "lilwalk-ocean-clogs",

    sku: "LW-013",

    image: "/products/lw-ocean.png",

    name: "LilWalk Ocean Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Archived",

    inventory: {
      available: 4,
      reserved: 0,
      incoming: 0,
    },

    pricing: {
      costPrice: 340,
      sellingPrice: 699,
      mrp: 899,
      profit: 359,
      margin: 51.4,
    },

    performance: {
      ordersToday: 0,
      revenueToday: 0,
      returnsPercentage: 0,
      healthScore: 65,
    },

    aiRecommendations: [],

    listings: [],

    createdAt: "2026-06-20",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_014",

    slug: "lilwalk-safari-clogs",

    sku: "LW-014",

    image: "/products/lw-safari.png",

    name: "LilWalk Safari Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 128,
      reserved: 13,
      incoming: 90,
    },

    pricing: {
      costPrice: 410,
      sellingPrice: 849,
      mrp: 1199,
      profit: 439,
      margin: 51.7,
    },

    performance: {
      ordersToday: 29,
      revenueToday: 24621,
      returnsPercentage: 1.1,
      healthScore: 98,
    },

    aiRecommendations: [],

    listings: [],

    createdAt: "2026-07-10",

    updatedAt: "2026-07-12",
  },

  {
    id: "prd_015",

    slug: "lilwalk-galaxy-clogs",

    sku: "LW-015",

    image: "/products/lw-galaxy.png",

    name: "LilWalk Galaxy Clogs",

    brand: "LilWalk",

    category: "Kids Clogs",

    status: "Active",

    inventory: {
      available: 183,
      reserved: 18,
      incoming: 110,
    },

    pricing: {
      costPrice: 425,
      sellingPrice: 899,
      mrp: 1299,
      profit: 474,
      margin: 52.7,
    },

    performance: {
      ordersToday: 38,
      revenueToday: 34162,
      returnsPercentage: 0.9,
      healthScore: 100,
    },

    aiRecommendations: [
      {
        id: "ai-015",
        type: "marketing",
        priority: "low",
        message:
          "Best-performing product this month.",
      },
    ],

    listings: [],

    createdAt: "2026-07-11",

    updatedAt: "2026-07-12",
  },

];