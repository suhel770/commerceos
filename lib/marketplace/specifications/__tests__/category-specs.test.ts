import { describe, it, expect } from "vitest";
import {
  detectCategoryFamily,
  detectCategoryVertical,
  getCategorySpecs,
} from "../category-specs.service";

describe("category-specs.service multi-vertical intelligence", () => {
  it("detects smartphone vertical and enforces SERIAL_NUMBER (IMEI)", () => {
    expect(detectCategoryVertical("Electronics", "Smartphones")).toBe("smartphone");
    expect(detectCategoryVertical("Mobiles", "Mobile Phones")).toBe("smartphone");

    const specs = getCategorySpecs("Electronics", "Smartphones");
    expect(specs.id).toBe("smartphone");
    expect(specs.family).toBe("electronics");
    expect(specs.defaultTrackingMode).toBe("SERIAL_NUMBER");
    expect(specs.hardwareFieldsRequired).toBe(true);
    expect(specs.specifications.some((s) => s.key === "ram_rom")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "processor")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "camera_setup")).toBe(true);
  });

  it("detects laptop vertical and renders CPU, RAM, SSD specs", () => {
    expect(detectCategoryVertical("Electronics", "Laptops & Computers")).toBe("laptop");
    expect(detectCategoryVertical("Computers", "MacBook")).toBe("laptop");

    const specs = getCategorySpecs("Electronics", "Laptops");
    expect(specs.id).toBe("laptop");
    expect(specs.defaultTrackingMode).toBe("SERIAL_NUMBER");
    expect(specs.specifications.some((s) => s.key === "laptop_processor")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "laptop_ram_storage")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "laptop_graphics")).toBe(true);
  });

  it("detects cables & chargers vertical with STANDARD tracking mode (no serial required)", () => {
    expect(detectCategoryVertical("Electronics", "Cables & Adapters")).toBe("cables_chargers");
    expect(detectCategoryVertical("Mobile Accessories", "Fast Charging Cable")).toBe("cables_chargers");

    const specs = getCategorySpecs("Electronics", "Cables & Adapters");
    expect(specs.id).toBe("cables_chargers");
    // Cables should NOT require unit serial numbers!
    expect(specs.defaultTrackingMode).toBe("STANDARD");
    expect(specs.specifications.some((s) => s.key === "connector_type")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "output_wattage")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "cable_length")).toBe(true);
  });

  it("detects powerbank vertical with battery capacity and wattage specs", () => {
    expect(detectCategoryVertical("Electronics", "Power Banks")).toBe("powerbank");

    const specs = getCategorySpecs("Electronics", "Power Bank");
    expect(specs.id).toBe("powerbank");
    expect(specs.specifications.some((s) => s.key === "battery_capacity_mah")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "powerbank_wattage")).toBe(true);
  });

  it("detects audio/earbuds vertical with ANC and playtime specs", () => {
    expect(detectCategoryVertical("Electronics", "TWS Earbuds")).toBe("audio");
    expect(detectCategoryVertical("Audio", "Bluetooth Headphones")).toBe("audio");

    const specs = getCategorySpecs("Electronics", "TWS Earbuds");
    expect(specs.id).toBe("audio");
    expect(specs.specifications.some((s) => s.key === "noise_cancellation")).toBe(true);
    expect(specs.specifications.some((s) => s.key === "playtime_battery")).toBe(true);
  });

  it("detects footwear, jewelry, and beauty properly", () => {
    expect(detectCategoryVertical("Footwear", "Sandals")).toBe("footwear");
    expect(detectCategoryVertical("Jewelry", "Rings")).toBe("jewelry");
    expect(detectCategoryVertical("Beauty", "Face Serum")).toBe("beauty");
  });
});
