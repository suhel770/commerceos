/**
 * CommerceOS Dynamic Category Specifications & Tracking Governance
 * 
 * Provides granular leaf-level specifications, hardware identifiers,
 * and inventory tracking policies (Standard vs Serial/IMEI vs Batch/Lot)
 * tailored to exact verticals (Smartphones, Laptops, Cables, Chargers,
 * Powerbanks, Audio/TWS, Smartwatches, Footwear, Jewelry, Apparel, etc.).
 */

export type CategoryFamily =
  | "electronics"
  | "footwear"
  | "jewelry"
  | "apparel"
  | "beauty"
  | "general";

export type InventoryTrackingMode = "STANDARD" | "SERIAL_NUMBER" | "BATCH_LOT";

export interface CategorySpecDefinition {
  key: string;
  label: string;
  group: "hardware" | "technical" | "material" | "design" | "compliance";
  placeholder: string;
  required?: boolean;
  suggestions: string[];
  description?: string;
}

export interface CategoryVerticalConfig {
  id: string;
  family: CategoryFamily;
  displayName: string;
  badgeLabel: string;
  badgeColor: "blue" | "indigo" | "amber" | "emerald" | "rose" | "slate" | "violet";
  defaultTrackingMode: InventoryTrackingMode;
  trackingModeReason: string;
  hardwareFieldsRequired: boolean;
  hardwareGuide: string;
  specifications: CategorySpecDefinition[];
}

export const CATEGORY_VERTICAL_CONFIGS: Record<string, CategoryVerticalConfig> = {
  // 1. SMARTWATCHES & WEARABLES
  smartwatch: {
    id: "smartwatch",
    family: "electronics",
    displayName: "Smartwatches & Fitness Bands",
    badgeLabel: "⌚ Smartwatch & Wearable Specs",
    badgeColor: "blue",
    defaultTrackingMode: "SERIAL_NUMBER",
    trackingModeReason:
      "High-value tech wearable. Unit-level Serial Number scanning is enforced during Purchase Inward (GRN) and Order Dispatch for warranty claims & return fraud protection.",
    hardwareFieldsRequired: true,
    hardwareGuide: "Model Number and Model Name are mandatory for Amazon ASIN matching and Flipkart electronic specs.",
    specifications: [
      {
        key: "display_size",
        label: "Display Size & Panel",
        group: "technical",
        placeholder: "e.g. 1.83 inch AMOLED, 1.43 inch HD...",
        required: true,
        suggestions: [
          "1.83\" AMOLED (550 Nits)",
          "1.43\" HD Display",
          "1.96\" Ultra AMOLED",
          "2.0\" Curved Display",
          "1.69\" TFT LCD",
        ],
        description: "Screen size, resolution and panel brightness.",
      },
      {
        key: "dial_shape",
        label: "Dial / Casing Shape",
        group: "design",
        placeholder: "e.g. Square, Round, Rectangle...",
        required: true,
        suggestions: ["Square", "Round", "Rectangle", "Oval"],
        description: "Physical casing silhouette.",
      },
      {
        key: "battery_life",
        label: "Battery Life & Standby",
        group: "technical",
        placeholder: "e.g. Up to 7 Days (Normal)...",
        required: true,
        suggestions: [
          "Up to 7 Days (Normal)",
          "10 Days (Power Saver)",
          "48 Hours (BT Calling)",
          "14 Days Standby",
          "Fast Charge (10m = 24h)",
        ],
        description: "Operating battery endurance per full charge.",
      },
      {
        key: "water_resistance",
        label: "Water & Ingress Rating",
        group: "technical",
        placeholder: "e.g. IP68 Water Resistant...",
        required: true,
        suggestions: [
          "IP68 Water Resistant",
          "5 ATM (50m Swimproof)",
          "IP67 Splash Proof",
          "3 ATM Water Resistant",
        ],
        description: "Official IP or ATM environmental rating.",
      },
      {
        key: "compatible_os",
        label: "Compatible Operating Systems",
        group: "technical",
        placeholder: "e.g. Android & iOS...",
        required: true,
        suggestions: [
          "Android & iOS",
          "Android 5.0+ / iOS 9.0+",
          "Android Only",
          "iOS Only",
        ],
        description: "Smartphone companion app platform.",
      },
      {
        key: "connectivity",
        label: "Connectivity & Calling",
        group: "technical",
        placeholder: "e.g. Bluetooth 5.3 + Calling...",
        required: false,
        suggestions: [
          "Bluetooth 5.3 + Calling",
          "Bluetooth 5.0",
          "Bluetooth + Wi-Fi",
          "GPS + BT Calling",
          "Cellular (eSIM)",
        ],
        description: "Wireless communication interfaces.",
      },
      {
        key: "sensors",
        label: "Health & Fitness Sensors",
        group: "technical",
        placeholder: "e.g. Heart Rate, SpO2, Sleep Monitor...",
        required: false,
        suggestions: [
          "Heart Rate & SpO2 Monitor",
          "HR, SpO2, Sleep & Stress",
          "Pedometer & Step Counter",
          "Multi-Sports Tracker (100+)",
        ],
        description: "Onboard biological and environmental sensors.",
      },
    ],
  },

  // 2. SMARTPHONES & MOBILES
  smartphone: {
    id: "smartphone",
    family: "electronics",
    displayName: "Smartphones & Mobile Phones",
    badgeLabel: "📱 Smartphone & IMEI Specs",
    badgeColor: "indigo",
    defaultTrackingMode: "SERIAL_NUMBER",
    trackingModeReason:
      "Mobile devices require strict Dual IMEI and Serial Number scanning during Purchase Inward and Fulfillment for regulatory compliance and carrier warranty validation.",
    hardwareFieldsRequired: true,
    hardwareGuide: "Model Number, Regulatory IMEI and Model Name are strictly required by all marketplaces.",
    specifications: [
      {
        key: "ram_rom",
        label: "RAM & Internal Storage",
        group: "technical",
        placeholder: "e.g. 8GB RAM + 128GB Storage...",
        required: true,
        suggestions: [
          "6GB RAM + 128GB ROM",
          "8GB RAM + 128GB ROM",
          "8GB RAM + 256GB ROM",
          "12GB RAM + 256GB ROM",
          "16GB RAM + 512GB ROM",
        ],
        description: "Memory and onboard storage capacity.",
      },
      {
        key: "processor",
        label: "Processor / Chipset",
        group: "technical",
        placeholder: "e.g. Snapdragon 8 Gen 3, Dimensity 7050...",
        required: true,
        suggestions: [
          "Snapdragon 8 Gen 3 (Octa-Core)",
          "Snapdragon 7s Gen 2",
          "MediaTek Dimensity 7050",
          "MediaTek Dimensity 8300 Ultra",
          "Apple A17 Pro (6-Core)",
          "Apple A16 Bionic",
        ],
        description: "Central processing unit architecture.",
      },
      {
        key: "screen_size_display",
        label: "Screen Size & Display Type",
        group: "technical",
        placeholder: "e.g. 6.7 inch AMOLED 120Hz...",
        required: true,
        suggestions: [
          "6.67\" 120Hz FHD+ AMOLED",
          "6.7\" 1.5K Curved AMOLED",
          "6.1\" Super Retina XDR",
          "6.5\" 90Hz IPS LCD",
          "6.8\" Dynamic AMOLED 2X",
        ],
        description: "Display diagonal, resolution and refresh rate.",
      },
      {
        key: "camera_setup",
        label: "Camera Setup (Rear & Front)",
        group: "technical",
        placeholder: "e.g. 50MP OIS + 8MP Wide / 16MP Selfie...",
        required: true,
        suggestions: [
          "50MP OIS + 8MP Ultrawide / 16MP Front",
          "64MP Triple Camera / 32MP Front",
          "200MP OIS Quad Camera / 50MP Front",
          "50MP Dual Camera / 12MP TrueDepth",
        ],
        description: "Primary and secondary optics sensor configuration.",
      },
      {
        key: "battery_charging",
        label: "Battery Capacity & Fast Charging",
        group: "technical",
        placeholder: "e.g. 5000 mAh + 67W Fast Charger...",
        required: true,
        suggestions: [
          "5000 mAh + 67W Turbo Charge",
          "5000 mAh + 33W Fast Charge",
          "4500 mAh + 120W HyperCharge",
          "5000 mAh + 15W Wireless Charge",
        ],
        description: "Battery mAh rating and wired/wireless charging speed.",
      },
      {
        key: "network_cellular",
        label: "Network & Cellular Connectivity",
        group: "technical",
        placeholder: "e.g. 5G Dual SIM (Nano + eSIM)...",
        required: false,
        suggestions: [
          "5G Dual SIM (Nano + Nano)",
          "5G (Dual SIM Nano + eSIM)",
          "4G VoLTE Dual SIM",
        ],
        description: "Cellular radio generation and SIM slots.",
      },
      {
        key: "operating_system",
        label: "Operating System & Version",
        group: "technical",
        placeholder: "e.g. Android 14, iOS 17...",
        required: true,
        suggestions: [
          "Android 14 (OxygenOS / OneUI)",
          "Android 14 (Stock Android)",
          "iOS 17",
          "iOS 18",
        ],
        description: "Pre-installed mobile operating system.",
      },
    ],
  },

  // 3. LAPTOPS & COMPUTERS
  laptop: {
    id: "laptop",
    family: "electronics",
    displayName: "Laptops & Computers",
    badgeLabel: "💻 Laptop & Computing Specs",
    badgeColor: "violet",
    defaultTrackingMode: "SERIAL_NUMBER",
    trackingModeReason:
      "Laptops require unit-level Serial Number tracking for manufacturer warranty activation and service center validation.",
    hardwareFieldsRequired: true,
    hardwareGuide: "Model Number, Processor configuration and Part Number are mandatory for catalog indexing.",
    specifications: [
      {
        key: "laptop_processor",
        label: "Processor & Generation",
        group: "technical",
        placeholder: "e.g. Intel Core i5 13th Gen, AMD Ryzen 7...",
        required: true,
        suggestions: [
          "Intel Core i5 13th Gen (13420H)",
          "Intel Core i7 13th Gen (13700H)",
          "AMD Ryzen 5 7530U (6-Core)",
          "AMD Ryzen 7 7735HS (8-Core)",
          "Apple M3 Chip (8-Core CPU / 10-Core GPU)",
          "Apple M2 Chip",
        ],
        description: "CPU generation and core architecture.",
      },
      {
        key: "laptop_ram_storage",
        label: "RAM & Storage SSD",
        group: "technical",
        placeholder: "e.g. 16GB DDR5 + 512GB SSD...",
        required: true,
        suggestions: [
          "16GB DDR5 + 512GB NVMe SSD",
          "16GB DDR5 + 1TB NVMe SSD",
          "8GB DDR4 + 512GB SSD",
          "32GB DDR5 + 1TB PCIe 4.0 SSD",
          "8GB Unified Memory + 256GB SSD",
        ],
        description: "System memory and high-speed NVMe solid state storage.",
      },
      {
        key: "laptop_screen",
        label: "Display Size & Resolution",
        group: "technical",
        placeholder: "e.g. 15.6 inch FHD Anti-Glare...",
        required: true,
        suggestions: [
          "15.6\" FHD (1920x1080) 120Hz Anti-Glare",
          "14\" 2.8K (2880x1800) 90Hz OLED",
          "16\" WQXGA 165Hz IPS Display",
          "13.6\" Liquid Retina Display (MacBook)",
        ],
        description: "Screen size, resolution and refresh rate.",
      },
      {
        key: "laptop_graphics",
        label: "Graphics Card (GPU)",
        group: "technical",
        placeholder: "e.g. NVIDIA RTX 4050 6GB or Integrated...",
        required: true,
        suggestions: [
          "Intel Iris Xe Graphics (Integrated)",
          "AMD Radeon Graphics (Integrated)",
          "NVIDIA GeForce RTX 3050 (4GB GDDR6)",
          "NVIDIA GeForce RTX 4050 (6GB GDDR6)",
          "NVIDIA GeForce RTX 4060 (8GB GDDR6)",
        ],
        description: "Dedicated or integrated graphics processing unit.",
      },
      {
        key: "laptop_os",
        label: "Operating System",
        group: "technical",
        placeholder: "e.g. Windows 11 Home with MS Office...",
        required: true,
        suggestions: [
          "Windows 11 Home + MS Office Home & Student 2021",
          "Windows 11 Pro",
          "macOS Sonoma",
          "Ubuntu Linux",
          "DOS (No Pre-installed OS)",
        ],
        description: "Bundled OS and productivity software license.",
      },
      {
        key: "laptop_weight",
        label: "Weight & Battery Backup",
        group: "technical",
        placeholder: "e.g. 1.4 kg (Up to 8 Hours Backup)...",
        required: false,
        suggestions: [
          "1.38 kg (Thin & Light / Up to 10h)",
          "1.65 kg (Up to 8h Backup)",
          "2.2 kg (Gaming Laptop / 54Wh Battery)",
          "1.24 kg (Ultra-portable MacBook Air)",
        ],
        description: "Physical net weight and battery runtime.",
      },
    ],
  },

  // 4. MOBILE CABLES & FAST CHARGERS
  cables_chargers: {
    id: "cables_chargers",
    family: "electronics",
    displayName: "Cables, Chargers & Adapters",
    badgeLabel: "🔌 Cable & Charger Specs",
    badgeColor: "amber",
    defaultTrackingMode: "STANDARD",
    trackingModeReason:
      "Accessories are tracked by standard SKU piece counts. Serial Number tracking is not required for standard charging accessories.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Manufacturer Part Number and Cable/Charger model specifications.",
    specifications: [
      {
        key: "connector_type",
        label: "Connector & Interface Type",
        group: "technical",
        placeholder: "e.g. Type-C to Type-C, USB-A to Type-C...",
        required: true,
        suggestions: [
          "Type-C to Type-C (PD)",
          "USB-A to Type-C",
          "Type-C to Lightning (Apple)",
          "3-in-1 Multi Cable (Type-C + Micro + Lightning)",
          "Dual Type-C + USB-A GaN Wall Charger",
          "Single Port 20W Type-C Adapter",
        ],
        description: "Physical plug interfaces on both ends or charger output ports.",
      },
      {
        key: "output_wattage",
        label: "Fast Charging Wattage (Max Output)",
        group: "technical",
        placeholder: "e.g. 65W Fast Charge, 100W GaN...",
        required: true,
        suggestions: [
          "65W Power Delivery (GaN)",
          "100W Ultra Fast (Laptops & Phones)",
          "33W Dart / SuperVOOC Fast Charge",
          "20W PD Fast Charging (iPhone/Pixel)",
          "120W HyperCharge",
          "18W Quick Charge 3.0",
        ],
        description: "Maximum supported power output rating.",
      },
      {
        key: "cable_length",
        label: "Cable Length / Form Factor",
        group: "material",
        placeholder: "e.g. 1 Meter (3.3 ft), 2 Meter...",
        required: true,
        suggestions: [
          "1.0 Meter (3.3 ft)",
          "1.2 Meter (4.0 ft)",
          "1.5 Meter (5.0 ft)",
          "2.0 Meter (6.6 ft Extra Long)",
          "Wall Plug Adapter (No Cable)",
        ],
        description: "Cable length or physical wall plug form factor.",
      },
      {
        key: "cable_material",
        label: "Cable Material & Build Quality",
        group: "material",
        placeholder: "e.g. Nylon Braided, Silicone...",
        required: false,
        suggestions: [
          "Heavy-Duty Nylon Braided (Anti-Fray)",
          "Tangle-Free Liquid Silicone",
          "Reinforced PVC",
          "Fireproof Polycarbonate (Charger)",
        ],
        description: "Jacket insulation and strain-relief build.",
      },
      {
        key: "charging_protocols",
        label: "Supported Charging Protocols",
        group: "compliance",
        placeholder: "e.g. USB-PD 3.0, QC 4.0, PPS...",
        required: false,
        suggestions: [
          "Power Delivery 3.0 (PD) + PPS",
          "Quick Charge 3.0 / 4.0",
          "SuperVOOC / Warp / Dash Compatible",
          "Apple 2.4A + Samsung AFC",
        ],
        description: "Certified fast charging handshakes and protocol support.",
      },
      {
        key: "data_speed",
        label: "Data Transfer Speed",
        group: "technical",
        placeholder: "e.g. 480 Mbps (USB 2.0), 10 Gbps...",
        required: false,
        suggestions: [
          "480 Mbps (High Speed USB 2.0)",
          "5 Gbps (USB 3.0 / 3.1 Gen 1)",
          "10 Gbps (USB 3.2 Gen 2)",
          "Charging Only (No Data Sync)",
        ],
        description: "Sync and file transfer bandwidth.",
      },
    ],
  },

  // 5. POWER BANKS & PORTABLE CHARGING
  powerbank: {
    id: "powerbank",
    family: "electronics",
    displayName: "Power Banks & Portable Batteries",
    badgeLabel: "🔋 Power Bank & Battery Specs",
    badgeColor: "emerald",
    defaultTrackingMode: "STANDARD",
    trackingModeReason:
      "Power banks use standard SKU quantity inventory. High-capacity laptop power banks may optionally track Serial Numbers for warranty.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Model Number, BIS CRS Registration Number and battery capacity.",
    specifications: [
      {
        key: "battery_capacity_mah",
        label: "Battery Capacity (mAh)",
        group: "technical",
        placeholder: "e.g. 10,000 mAh, 20,000 mAh...",
        required: true,
        suggestions: [
          "10,000 mAh (Pocket Size)",
          "20,000 mAh (Long Haul Travel)",
          "30,000 mAh (Heavy Duty)",
          "5,000 mAh (Ultra Slim Magnetic / MagSafe)",
        ],
        description: "Total battery cell charge rating.",
      },
      {
        key: "powerbank_wattage",
        label: "Fast Charging Output Wattage",
        group: "technical",
        placeholder: "e.g. 22.5W Fast Charge, 65W Laptop PD...",
        required: true,
        suggestions: [
          "22.5W Two-Way Fast Charge",
          "33W SuperVOOC / PD Fast Charge",
          "65W Power Delivery (Charges Laptops)",
          "15W Wireless Magnetic Charging",
          "18W Quick Charge",
        ],
        description: "Maximum simultaneous discharging power.",
      },
      {
        key: "output_ports",
        label: "Output Ports & Interfaces",
        group: "technical",
        placeholder: "e.g. 2x USB-A + 1x Type-C...",
        required: true,
        suggestions: [
          "Triple Output: 2x USB-A + 1x Type-C (PD)",
          "Dual Output: 1x USB-A + 1x Type-C",
          "Quad Output: 3x USB-A + 1x Type-C",
          "Wireless MagSafe Pad + 1x Type-C",
        ],
        description: "Available physical output connections for devices.",
      },
      {
        key: "recharge_input",
        label: "Recharge Input Time & Ports",
        group: "technical",
        placeholder: "e.g. Type-C 18W Fast Input...",
        required: false,
        suggestions: [
          "Type-C 18W Fast Inward (Recharges in 4h)",
          "Dual Input: Type-C + Micro-USB",
          "Type-C 65W Ultra Fast Recharge",
        ],
        description: "How the power bank itself is recharged.",
      },
      {
        key: "flight_safety",
        label: "Aviation / Flight Safety Approval",
        group: "compliance",
        placeholder: "e.g. Flight Approved (Under 100Wh)...",
        required: false,
        suggestions: [
          "Flight Approved (74Wh - Safe for Cabin Baggage)",
          "Flight Approved (37Wh - Ultra Safe)",
          "BIS Certified (IS 13252 Compliant)",
        ],
        description: "Regulatory compliance for airline travel.",
      },
    ],
  },

  // 6. AUDIO, HEADPHONES & TWS EARBUDS
  audio: {
    id: "audio",
    family: "electronics",
    displayName: "Audio, Earbuds & Headphones",
    badgeLabel: "🎧 Audio & TWS Earbuds Specs",
    badgeColor: "rose",
    defaultTrackingMode: "SERIAL_NUMBER",
    trackingModeReason:
      "TWS Earbuds and premium headphones require Serial Number tracking for single earbud replacements and warranty claims.",
    hardwareFieldsRequired: true,
    hardwareGuide: "Model Number, Driver size and warranty specifications.",
    specifications: [
      {
        key: "headphone_type",
        label: "Audio Form Factor",
        group: "design",
        placeholder: "e.g. True Wireless (TWS), Over-Ear...",
        required: true,
        suggestions: [
          "True Wireless Earbuds (TWS In-Ear)",
          "Over-Ear Wireless Headphones",
          "Wireless Neckband Earphones",
          "Portable Bluetooth Speaker",
          "On-Ear Lightweight Headset",
        ],
        description: "Acoustic physical format.",
      },
      {
        key: "playtime_battery",
        label: "Total Playtime & Battery Life",
        group: "technical",
        placeholder: "e.g. Up to 40 Hours with Case...",
        required: true,
        suggestions: [
          "Up to 40 Hours Total Playtime (with Case)",
          "50 Hours Marathon Battery",
          "30 Hours (ANC On) / 40 Hours (ANC Off)",
          "60 Hours Battery Life (Headphones)",
          "12 Hours Continuous Speaker Playtime",
        ],
        description: "Total combined battery endurance.",
      },
      {
        key: "noise_cancellation",
        label: "Noise Cancellation Technology",
        group: "technical",
        placeholder: "e.g. Active Noise Cancellation (ANC)...",
        required: true,
        suggestions: [
          "Active Noise Cancellation (Up to 32dB ANC)",
          "Hybrid ANC (Up to 45dB Deep Noise Reduction)",
          "Environmental Noise Cancellation (Quad Mic ENC)",
          "Passive Noise Isolation",
        ],
        description: "Microphone algorithms and acoustic isolation.",
      },
      {
        key: "driver_size",
        label: "Driver Size & Audio Quality",
        group: "technical",
        placeholder: "e.g. 13mm Titanium Drivers, Bass Boost...",
        required: false,
        suggestions: [
          "13mm Titanium Dynamic Drivers (Deep Bass)",
          "10mm Bass Boost Drivers",
          "40mm Studio Dynamic Drivers",
          "Dual Balance Armature Drivers (Hi-Res Audio)",
        ],
        description: "Speaker diaphragm diameter and acoustic tuning.",
      },
      {
        key: "bluetooth_version",
        label: "Bluetooth & Latency",
        group: "technical",
        placeholder: "e.g. Bluetooth 5.3 + 45ms Low Latency...",
        required: false,
        suggestions: [
          "Bluetooth 5.3 + 45ms Beast Mode Gaming",
          "Bluetooth 5.3 (Dual Pairing / Multipoint)",
          "Bluetooth 5.2 (10m Wireless Range)",
          "Bluetooth 5.4 with LDAC Hi-Res Support",
        ],
        description: "Wireless protocol, audio codec and latency.",
      },
    ],
  },

  // 7. FOOTWEAR
  footwear: {
    id: "footwear",
    family: "footwear",
    displayName: "Footwear & Shoes",
    badgeLabel: "👟 Footwear & Shoe Specs",
    badgeColor: "indigo",
    defaultTrackingMode: "STANDARD",
    trackingModeReason: "Size and quantity variant inventory. Standard SKU/size inventory count tracking.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Optional style code and manufacturer reference for footwear lines.",
    specifications: [
      {
        key: "outer_material",
        label: "Upper / Outer Material",
        group: "material",
        placeholder: "e.g. EVA, Synthetic Leather, Mesh...",
        required: true,
        suggestions: [
          "EVA (Lightweight)",
          "Synthetic Leather",
          "Breathable Mesh",
          "Canvas",
          "Genuine Leather",
          "PVC",
        ],
        description: "Primary upper surface construction material.",
      },
      {
        key: "sole_material",
        label: "Sole / Outsole Material",
        group: "material",
        placeholder: "e.g. EVA, Rubber, TPR...",
        required: true,
        suggestions: [
          "EVA (Shock Absorbing)",
          "Rubber (Anti-Skid)",
          "TPR (Thermoplastic)",
          "Phylon",
          "Air Cushion Sole",
        ],
        description: "Bottom grip and cushioning compound.",
      },
      {
        key: "closure_type",
        label: "Closure / Fastening",
        group: "design",
        placeholder: "e.g. Slip-on, Lace-up, Hook & Loop...",
        required: true,
        suggestions: [
          "Slip-on",
          "Lace-Up",
          "Hook & Loop (Velcro)",
          "Backstrap / Buckle",
          "Zipper",
        ],
        description: "Foot retention and adjustment mechanism.",
      },
      {
        key: "toe_shape",
        label: "Toe Shape & Style",
        group: "design",
        placeholder: "e.g. Round Toe, Open Toe...",
        required: false,
        suggestions: ["Round Toe", "Open Toe", "Pointed Toe", "Square Toe"],
        description: "Front toe silhouette.",
      },
      {
        key: "occasion",
        label: "Occasion / Ideal For",
        group: "design",
        placeholder: "e.g. Casual, Sports, Festive...",
        required: false,
        suggestions: [
          "Casual / Daily Wear",
          "Sports & Running",
          "Party & Festive",
          "Formal / Office",
          "Beach & Water",
        ],
        description: "Recommended lifestyle wearing context.",
      },
    ],
  },

  // 8. JEWELRY
  jewelry: {
    id: "jewelry",
    family: "jewelry",
    displayName: "Jewelry & Precious Accessories",
    badgeLabel: "💎 Jewelry & Hallmarking Specs",
    badgeColor: "amber",
    defaultTrackingMode: "STANDARD",
    trackingModeReason: "Standard SKU count or optional Serial Number tracking for high-value certified stones.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Style code, hallmark identification and certificate serial.",
    specifications: [
      {
        key: "precious_metal",
        label: "Base Metal / Alloy",
        group: "material",
        placeholder: "e.g. 925 Sterling Silver, Brass, Gold...",
        required: true,
        suggestions: [
          "925 Sterling Silver",
          "18K Gold Plated",
          "Brass / Copper Alloy",
          "Stainless Steel",
          "14K Real Gold",
        ],
        description: "Base structural metal or plating alloy.",
      },
      {
        key: "metal_purity",
        label: "Purity / Karat / Finish",
        group: "compliance",
        placeholder: "e.g. 92.5% Pure Silver, 18 Karat...",
        required: true,
        suggestions: [
          "925 Pure Silver",
          "18 Karat (18K)",
          "22 Karat (22K)",
          "High Polish Rhodium",
          "Anti-Tarnish Coated",
        ],
        description: "Precious metal fineness or surface treatment.",
      },
      {
        key: "gemstone_type",
        label: "Gemstone / Stone Type",
        group: "material",
        placeholder: "e.g. Cubic Zirconia, Freshwater Pearl...",
        required: false,
        suggestions: [
          "Cubic Zirconia (CZ)",
          "American Diamond (AD)",
          "Freshwater Pearl",
          "No Gemstone (Plain)",
        ],
        description: "Inlaid or set gem variety.",
      },
      {
        key: "certification",
        label: "Certification / Hallmarking",
        group: "compliance",
        placeholder: "e.g. BIS Hallmarked, Brand Authenticity...",
        required: false,
        suggestions: [
          "BIS Hallmarked",
          "Brand Authenticity Certificate",
          "IGI Certified",
          "Not Applicable",
        ],
        description: "Independent assay or laboratory certification.",
      },
      {
        key: "clasp_type",
        label: "Clasp & Fastening Type",
        group: "design",
        placeholder: "e.g. Lobster Claw, S-Hook, Spring Ring...",
        required: false,
        suggestions: [
          "Lobster Claw",
          "S-Hook Clasp",
          "Spring Ring",
          "Adjustable Drawstring",
        ],
        description: "Locking or fastening closure for jewelry.",
      },
    ],
  },

  // 9. APPAREL
  apparel: {
    id: "apparel",
    family: "apparel",
    displayName: "Apparel & Fashion Wear",
    badgeLabel: "👕 Apparel & Fabric Specs",
    badgeColor: "emerald",
    defaultTrackingMode: "STANDARD",
    trackingModeReason: "Size and color matrix inventory. Standard quantity tracking per SKU.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Style code and season collection reference.",
    specifications: [
      {
        key: "fabric",
        label: "Fabric Composition",
        group: "material",
        placeholder: "e.g. 100% Pure Cotton, Polyester Blend...",
        required: true,
        suggestions: [
          "100% Pure Cotton",
          "Cotton Blend (60/40)",
          "Polyester Spandex",
          "Denim (Stretch)",
          "Pure Linen",
        ],
        description: "Fiber blend and textile weave.",
      },
      {
        key: "fit_type",
        label: "Fit Silhouette",
        group: "design",
        placeholder: "e.g. Regular Fit, Slim Fit, Oversized...",
        required: true,
        suggestions: [
          "Regular Fit",
          "Slim Fit",
          "Oversized / Baggy",
          "Relaxed Fit",
        ],
        description: "Garment cut and body drape style.",
      },
      {
        key: "pattern",
        label: "Pattern & Print",
        group: "design",
        placeholder: "e.g. Solid, Graphic Printed, Striped...",
        required: false,
        suggestions: [
          "Solid / Plain",
          "Graphic Printed",
          "Striped",
          "Checked / Plaid",
          "Floral Print",
        ],
        description: "Visual surface pattern styling.",
      },
      {
        key: "neck_type",
        label: "Neckline / Collar",
        group: "design",
        placeholder: "e.g. Round Neck, Polo Collar, Hooded...",
        required: false,
        suggestions: [
          "Round Neck / Crew",
          "Polo Collar",
          "Hooded Neck",
          "V-Neck",
        ],
        description: "Collar or neck opening design.",
      },
      {
        key: "sleeve_length",
        label: "Sleeve Length",
        group: "design",
        placeholder: "e.g. Short Sleeves, Full Sleeves...",
        required: false,
        suggestions: [
          "Short Sleeves",
          "Full Sleeves",
          "Sleeveless",
          "3/4th Sleeves",
        ],
        description: "Arm sleeve extension style.",
      },
    ],
  },

  // 10. BEAUTY & PERSONAL CARE
  beauty: {
    id: "beauty",
    family: "beauty",
    displayName: "Beauty, Cosmetics & Wellness",
    badgeLabel: "🧴 Beauty, Shelf-Life & Batch Specs",
    badgeColor: "rose",
    defaultTrackingMode: "BATCH_LOT",
    trackingModeReason:
      "Perishable and personal care formulations require Batch / Lot tracking with Manufacturing Date and Expiry Date enforcement.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Regulatory cosmetic license number and formulation code.",
    specifications: [
      {
        key: "skin_type",
        label: "Suitable For / Skin & Hair Type",
        group: "compliance",
        placeholder: "e.g. All Skin Types, Oily, Sensitive...",
        required: true,
        suggestions: [
          "All Skin Types",
          "Oily & Acne-Prone",
          "Dry & Sensitive",
          "Combination Skin",
        ],
        description: "Target dermatological application.",
      },
      {
        key: "formulation",
        label: "Formulation / Form",
        group: "material",
        placeholder: "e.g. Serum, Cream, Gel, Liquid...",
        required: true,
        suggestions: [
          "Lightweight Serum",
          "Cream / Moisturizer",
          "Gel-based",
          "Liquid / Toner",
        ],
        description: "Physical state and viscosity.",
      },
      {
        key: "volume",
        label: "Net Quantity / Volume",
        group: "material",
        placeholder: "e.g. 30 ml, 50 ml, 100 g...",
        required: true,
        suggestions: ["30 ml", "50 ml", "100 ml", "50 g", "100 g"],
        description: "Packaged volume or net weight.",
      },
      {
        key: "benefits",
        label: "Key Action / Benefits",
        group: "compliance",
        placeholder: "e.g. Hydration, Glow, Anti-Acne...",
        required: false,
        suggestions: [
          "Hydration & Deep Moisture",
          "Skin Brightening & Glow",
          "Anti-Acne & Oil Control",
          "Sun Protection (SPF 50+)",
        ],
        description: "Primary claimed cosmetic efficacy.",
      },
    ],
  },

  // 11. GENERAL MERCHANDISE (FALLBACK)
  general: {
    id: "general",
    family: "general",
    displayName: "General Merchandise",
    badgeLabel: "📦 General Specifications",
    badgeColor: "slate",
    defaultTrackingMode: "STANDARD",
    trackingModeReason: "Standard unit quantity tracking for general merchandise.",
    hardwareFieldsRequired: false,
    hardwareGuide: "Standard model or part number reference.",
    specifications: [
      {
        key: "material",
        label: "Primary Material",
        group: "material",
        placeholder: "e.g. Plastic, Stainless Steel, Wood...",
        required: false,
        suggestions: [
          "Stainless Steel",
          "BPA-Free Plastic",
          "Engineered Wood",
          "Ceramic",
          "Silicone",
        ],
        description: "Primary structural composition.",
      },
      {
        key: "color_finish",
        label: "Color & Finish",
        group: "design",
        placeholder: "e.g. Matte Black, Glossy Silver...",
        required: false,
        suggestions: [
          "Matte Black",
          "Glossy White",
          "Brushed Silver",
          "Natural Wood",
        ],
        description: "Exterior finish and surface color.",
      },
      {
        key: "warranty_period",
        label: "Warranty Coverage",
        group: "compliance",
        placeholder: "e.g. 6 Months, 1 Year...",
        required: false,
        suggestions: [
          "No Warranty",
          "6 Months Brand Warranty",
          "1 Year Manufacturer Warranty",
          "2 Years Domestic Warranty",
        ],
        description: "Consumer protection warranty duration.",
      },
    ],
  },
};

/**
 * Detect the exact category vertical config based on category and subCategory.
 */
export function detectCategoryVertical(
  category?: string,
  subCategory?: string
): string {
  const cat = (category || "").toLowerCase();
  const sub = (subCategory || "").toLowerCase();
  const combined = `${cat} ${sub}`;

  // 1. AUDIO, HEADPHONES, EARBUDS, SPEAKERS (Check before 'phone' to avoid 'headphone' matching 'phone')
  if (
    sub.includes("headphone") ||
    sub.includes("earphone") ||
    sub.includes("earbud") ||
    sub.includes("speaker") ||
    sub.includes("audio") ||
    sub.includes("headset") ||
    sub.includes("tws") ||
    combined.includes("audio") ||
    combined.includes("earbuds") ||
    combined.includes("tws") ||
    combined.includes("headphones")
  ) {
    return "audio";
  }

  // 2. SMARTPHONES & MOBILES
  if (
    sub.includes("smartphone") ||
    sub.includes("mobile") ||
    sub.includes("phone") ||
    combined.includes("mobile phone") ||
    combined.includes("smartphone")
  ) {
    return "smartphone";
  }

  // 2. LAPTOPS & COMPUTERS
  if (
    sub.includes("laptop") ||
    sub.includes("computer") ||
    sub.includes("notebook") ||
    sub.includes("macbook") ||
    sub.includes("pc") ||
    combined.includes("laptop") ||
    combined.includes("computer")
  ) {
    return "laptop";
  }

  // 3. CABLES, CHARGERS & ADAPTERS
  if (
    sub.includes("cable") ||
    sub.includes("charger") ||
    sub.includes("adapter") ||
    sub.includes("wire") ||
    combined.includes("charging cable") ||
    combined.includes("fast charger") ||
    combined.includes("cables & adapters") ||
    combined.includes("usb cable")
  ) {
    return "cables_chargers";
  }

  // 4. POWER BANKS
  if (
    sub.includes("power bank") ||
    sub.includes("powerbank") ||
    combined.includes("power bank") ||
    combined.includes("powerbank")
  ) {
    return "powerbank";
  }


  // 6. SMARTWATCHES & WEARABLES
  if (
    sub.includes("smartwatch") ||
    sub.includes("smart watch") ||
    sub.includes("watch") ||
    sub.includes("wearable") ||
    sub.includes("fitness band") ||
    combined.includes("smartwatch") ||
    combined.includes("smart watch")
  ) {
    return "smartwatch";
  }

  // 7. FOOTWEAR
  if (
    sub.includes("sandal") ||
    sub.includes("shoe") ||
    sub.includes("clog") ||
    sub.includes("boot") ||
    sub.includes("sneaker") ||
    sub.includes("heel") ||
    sub.includes("slipper") ||
    sub.includes("flat") ||
    sub.includes("loafer") ||
    cat.includes("footwear") ||
    cat.includes("shoes")
  ) {
    return "footwear";
  }

  // 8. JEWELRY
  if (
    sub.includes("ring") ||
    sub.includes("necklace") ||
    sub.includes("earring") ||
    sub.includes("bangle") ||
    sub.includes("bracelet") ||
    sub.includes("pendant") ||
    cat.includes("jewel")
  ) {
    return "jewelry";
  }

  // 9. APPAREL
  if (
    sub.includes("shirt") ||
    sub.includes("t-shirt") ||
    sub.includes("tshirt") ||
    sub.includes("dress") ||
    sub.includes("jean") ||
    sub.includes("pant") ||
    sub.includes("trouser") ||
    sub.includes("kurta") ||
    cat.includes("apparel") ||
    cat.includes("clothing")
  ) {
    return "apparel";
  }

  // 10. BEAUTY
  if (
    sub.includes("serum") ||
    sub.includes("cream") ||
    sub.includes("skin") ||
    sub.includes("hair") ||
    sub.includes("makeup") ||
    cat.includes("beauty") ||
    cat.includes("cosmetic")
  ) {
    return "beauty";
  }

  // 11. GENERAL ELECTRONICS (FALLBACK TO SMARTWATCH / WEARABLES IF UNDER ELECTRONICS)
  if (cat.includes("electronic") || cat.includes("gadget")) {
    return "smartwatch";
  }

  return "general";
}

/**
 * Detect category family.
 */
export function detectCategoryFamily(
  category?: string,
  subCategory?: string
): CategoryFamily {
  const vertical = detectCategoryVertical(category, subCategory);
  return CATEGORY_VERTICAL_CONFIGS[vertical]?.family || "general";
}

/**
 * Retrieve the full category vertical configuration and specifications.
 */
export function getCategoryFamilyConfig(family: CategoryFamily): CategoryVerticalConfig {
  // If passed a family key, map to best default vertical
  return CATEGORY_VERTICAL_CONFIGS[family] || CATEGORY_VERTICAL_CONFIGS.general;
}

/**
 * Main resolution function: returns precise vertical configuration based on category & subCategory.
 */
export function getCategorySpecs(
  category?: string,
  subCategory?: string
): CategoryVerticalConfig {
  const verticalId = detectCategoryVertical(category, subCategory);
  return CATEGORY_VERTICAL_CONFIGS[verticalId] || CATEGORY_VERTICAL_CONFIGS.general;
}
