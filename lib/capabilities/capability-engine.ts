/**
 * CommerceOS Core Platform V2 — Universal Capability Engine
 * Single Source of Truth for Global Seller Experience Modes & Features.
 */

export type ExperienceLevel = "solo" | "growing" | "enterprise";

export type CommerceCapabilities = {
  // Module Access & Warehouse Flags
  canUseWarehouse: boolean;
  canUseTransfers: boolean;
  canUseMultiWarehouse: boolean;
  canUseDockPlanning: boolean;
  canUseQC: boolean;
  canUsePutaway: boolean;
  canUseDigitalTwin: boolean;
  canUseWarehouseBuilder: boolean;
  canUseBins: boolean;
  canUseZones: boolean;
  canUseASN: boolean;
  canUseRFID: boolean;
  canUseRobotics: boolean;
  canUseHeatmaps: boolean;

  // Catalog & Operations
  canUseAdvancedPIM: boolean;
  canUseAdvancedFulfillment: boolean;

  // Commercial, Financial & Governance Flags
  canUseDepartments: boolean;
  canUseCostCenters: boolean;
  canUseApprovals: boolean;
  canUseAuditLogs: boolean;
  canUseAdvancedReports: boolean;
  canUseVendorAnalytics: boolean;

  // Phase 6: Hardware & Automation Flags
  canUseHardwareHub: boolean;
  canUseThermalPrinting: boolean;
  canUseBluetoothScanner: boolean;
  canUseBasicAutomation: boolean;
  canUseRFIDHardware: boolean;
  canUseIndustrialPDA: boolean;
  canUseIoTAutomation: boolean;
  canUseMultiDeviceManagement: boolean;

  // AI Experience Flags
  canUseBasicAI: boolean;
  canUseEnterpriseAI: boolean;
  aiTier: "simple_guidance" | "optimization" | "executive_ai";

  // Counts & Unlocked Summaries (For Dev Simulator Inspection & Pricing Engines)
  unlockedModulesCount: number;
  activeCapabilityCount: number;
  unlockedModules: string[];
  visibleFeatures: string[];
};

export const SOLO_CAPABILITIES: CommerceCapabilities = {
  canUseWarehouse: false,
  canUseTransfers: false,
  canUseMultiWarehouse: false,
  canUseDockPlanning: false,
  canUseQC: false,
  canUsePutaway: false,
  canUseDigitalTwin: false,
  canUseWarehouseBuilder: false,
  canUseBins: false,
  canUseZones: false,
  canUseASN: false,
  canUseRFID: false,
  canUseRobotics: false,
  canUseHeatmaps: false,

  canUseAdvancedPIM: false,
  canUseAdvancedFulfillment: false,

  canUseDepartments: false,
  canUseCostCenters: false,
  canUseApprovals: false,
  canUseAuditLogs: false,
  canUseAdvancedReports: false,
  canUseVendorAnalytics: false,

  canUseHardwareHub: false,
  canUseThermalPrinting: false,
  canUseBluetoothScanner: false,
  canUseBasicAutomation: false,
  canUseRFIDHardware: false,
  canUseIndustrialPDA: false,
  canUseIoTAutomation: false,
  canUseMultiDeviceManagement: false,

  canUseBasicAI: true,
  canUseEnterpriseAI: false,
  aiTier: "simple_guidance",

  unlockedModulesCount: 7,
  activeCapabilityCount: 1,
  unlockedModules: [
    "Dashboard",
    "Products (Simple)",
    "Orders (Direct)",
    "Purchase (Auto-Receive)",
    "Inventory (Single Warehouse)",
    "Finance (Cashflow)",
    "Reports (Basic)",
  ],
  visibleFeatures: [
    "Streamlined Purchase → Stock → Sell Flow",
    "Direct Stock Balances",
    "Single Warehouse Intake",
    "Basic Guidance AI",
  ],
};

export const GROWING_CAPABILITIES: CommerceCapabilities = {
  canUseWarehouse: true,
  canUseTransfers: true,
  canUseMultiWarehouse: false,
  canUseDockPlanning: false,
  canUseQC: true,
  canUsePutaway: true,
  canUseDigitalTwin: false,
  canUseWarehouseBuilder: false,
  canUseBins: true,
  canUseZones: true,
  canUseASN: false,
  canUseRFID: false,
  canUseRobotics: false,
  canUseHeatmaps: false,

  canUseAdvancedPIM: true,
  canUseAdvancedFulfillment: true,

  canUseDepartments: false,
  canUseCostCenters: false,
  canUseApprovals: false,
  canUseAuditLogs: false,
  canUseAdvancedReports: true,
  canUseVendorAnalytics: true,

  canUseHardwareHub: true,
  canUseThermalPrinting: true,
  canUseBluetoothScanner: true,
  canUseBasicAutomation: true,
  canUseRFIDHardware: false,
  canUseIndustrialPDA: false,
  canUseIoTAutomation: false,
  canUseMultiDeviceManagement: false,

  canUseBasicAI: true,
  canUseEnterpriseAI: false,
  aiTier: "optimization",

  unlockedModulesCount: 9,
  activeCapabilityCount: 10,
  unlockedModules: [
    "Dashboard",
    "Products (Variants & Channels)",
    "Orders (Multi-Location Routing)",
    "Purchase",
    "Inventory (Multi-Bin)",
    "Warehouse Receiving",
    "QC Inspection",
    "Directed Put-away",
    "Finance & Reports",
  ],
  visibleFeatures: [
    "Operational Receiving Queue",
    "Basic Quality Control Inspection",
    "Target Bin & Zone Storage",
    "Stock Transfer Operations",
    "AI Inventory Optimization",
    "Vendor Analytics & Performance",
  ],
};

export const ENTERPRISE_CAPABILITIES: CommerceCapabilities = {
  canUseWarehouse: true,
  canUseTransfers: true,
  canUseMultiWarehouse: true,
  canUseDockPlanning: true,
  canUseQC: true,
  canUsePutaway: true,
  canUseDigitalTwin: true,
  canUseWarehouseBuilder: true,
  canUseBins: true,
  canUseZones: true,
  canUseASN: true,
  canUseRFID: true,
  canUseRobotics: true,
  canUseHeatmaps: true,

  canUseAdvancedPIM: true,
  canUseAdvancedFulfillment: true,

  canUseDepartments: true,
  canUseCostCenters: true,
  canUseApprovals: true,
  canUseAuditLogs: true,
  canUseAdvancedReports: true,
  canUseVendorAnalytics: true,

  canUseHardwareHub: true,
  canUseThermalPrinting: true,
  canUseBluetoothScanner: true,
  canUseBasicAutomation: true,
  canUseRFIDHardware: true,
  canUseIndustrialPDA: true,
  canUseIoTAutomation: true,
  canUseMultiDeviceManagement: true,

  canUseBasicAI: true,
  canUseEnterpriseAI: true,
  aiTier: "executive_ai",

  unlockedModulesCount: 12,
  activeCapabilityCount: 24,
  unlockedModules: [
    "Dashboard (Executive)",
    "Products (Omnichannel PIM)",
    "Orders (Split & SLA Routing)",
    "Purchase & Vendors",
    "Inventory (Multi-Bin & Network)",
    "Warehouse Command Console",
    "Digital Twin 2D/3D Builder",
    "Dock & Logistics",
    "QC & Quarantine Routing",
    "Directed Put-away Workstation",
    "Finance & Cost Centers",
    "Enterprise AI Advisor",
  ],
  visibleFeatures: [
    "Multi-Warehouse Network View",
    "Interactive Digital Twin & Heatmaps",
    "High-Volume Dock Scheduling & ASN",
    "Quarantine QC & SLA Risk Routing",
    "Approval Workflows & Audit Logs",
    "Departmental Cost Centers",
    "Robotics & RFID Integration",
    "Executive AI Strategic Insights",
  ],
};

export function getCapabilitiesForLevel(level: ExperienceLevel): CommerceCapabilities {
  switch (level) {
    case "solo":
      return SOLO_CAPABILITIES;
    case "growing":
      return GROWING_CAPABILITIES;
    case "enterprise":
      return ENTERPRISE_CAPABILITIES;
    default:
      return GROWING_CAPABILITIES;
  }
}
