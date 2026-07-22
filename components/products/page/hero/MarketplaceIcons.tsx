"use client";

import Image from "next/image";

interface Marketplace {

  id: string;

  name: string;

  logo: string;

  status: "live" | "draft" | "failed";

}

const marketplaces: Marketplace[] = [

  {

    id: "amazon",

    name: "Amazon",

    logo: "/marketplaces/amazon.png",

    status: "live",

  },

  {

    id: "flipkart",

    name: "Flipkart",

    logo: "/marketplaces/flipkart.png",

    status: "live",

  },

  {

    id: "meesho",

    name: "Meesho",

    logo: "/marketplaces/meesho.png",

    status: "draft",

  },

  {

    id: "shopify",

    name: "Shopify",

    logo: "/marketplaces/shopify.png",

    status: "live",

  },

];

export default function MarketplaceIcons() {

  return (

    <div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">

        Published On

      </p>

      <div className="flex flex-wrap gap-3">

        {marketplaces.map((marketplace) => (

          <div
            key={marketplace.id}
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
            "
          >

            <Image
              src={marketplace.logo}
              alt={marketplace.name}
              width={22}
              height={22}
            />

            <span className="text-sm font-medium">

              {marketplace.name}

            </span>

            <div
              className={`h-2.5 w-2.5 rounded-full ${
                marketplace.status === "live"
                  ? "bg-green-500"
                  : marketplace.status === "draft"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />

          </div>

        ))}

      </div>

    </div>

  );

}