import { describe, expect, it } from "vitest";
import { ALL_INDIAN_STATES_AND_UTS, extractPanFromGstin, stateNameFromGstin, type CreateVendorInput } from "./index";

function parseCsvLine(lineText: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < lineText.length; i++) {
    const char = lineText[i];
    if (char === '"') {
      if (inQuotes && lineText[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result.map((c) => c.replace(/^"|"$/g, "").trim());
}

function normalizeHeaderKey(rawHeader: string): string {
  const h = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (h.includes("vendorcode") || h.includes("suppliercode") || h === "code" || h === "vendorid" || h === "supplierid" || h === "id") {
    return "code";
  }
  if (h.includes("vendorname") || h.includes("suppliername") || h === "name" || h === "vendor" || h === "supplier") {
    return "name";
  }
  if (h.includes("registrationtype") || h.includes("regtype") || h.includes("registration")) {
    return "registrationType";
  }
  if (h.includes("gstin") || h.includes("gstno") || h.includes("gstnumber") || h === "gst") {
    return "gstin";
  }
  if (h.includes("pan") || h.includes("tannumber") || h === "tan" || h.includes("pantan")) {
    return "pan";
  }
  if (h.includes("phonenumber") || h.includes("phone") || h.includes("mobile") || h.includes("contactno") || h.includes("telephone")) {
    return "phone";
  }
  if (h.includes("email") || h.includes("mail")) {
    return "email";
  }
  if (h.includes("contactperson") || h.includes("contactname") || h === "contact" || h.includes("person")) {
    return "contactPerson";
  }
  if (h.includes("address") || h.includes("street")) {
    return "address";
  }
  if (h.includes("city") || h.includes("town") || h.includes("district")) {
    return "city";
  }
  if (h.includes("state") || h.includes("province") || h === "ut") {
    return "state";
  }
  if (h.includes("pincode") || h.includes("pin") || h.includes("zip") || h.includes("postal")) {
    return "pincode";
  }
  if (h.includes("bankname") || h === "bank") {
    return "bankName";
  }
  if (h.includes("accountname") || h.includes("accname") || h.includes("accountholder")) {
    return "bankAccountName";
  }
  if (h.includes("accountnumber") || h.includes("accountno") || h.includes("accno") || h.includes("accnumber")) {
    return "bankAccountNumber";
  }
  if (h.includes("ifsc") || h.includes("ifsccode")) {
    return "bankIfsc";
  }
  if (h.includes("paymentterms") || h.includes("creditdays") || h.includes("terms")) {
    return "paymentTermsDays";
  }
  if (h.includes("leadtime") || h.includes("deliverytime")) {
    return "leadTimeDays";
  }
  if (h.includes("status") || h.includes("vendorstatus")) {
    return "status";
  }
  if (h.includes("notes") || h.includes("remarks") || h.includes("comments")) {
    return "notes";
  }
  return rawHeader.trim();
}

function parseVendorCsv(text: string): CreateVendorInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);
  const list: CreateVendorInput[] = [];

  const addressIdx = normalizedHeaders.indexOf("address");

  for (let i = 1; i < lines.length; i++) {
    let cols = parseCsvLine(lines[i]);
    if (!cols[0]) continue;

    // Heuristic address repair for unquoted commas
    if (addressIdx !== -1 && cols.length === normalizedHeaders.length + 1 && cols[addressIdx]) {
      cols = [
        ...cols.slice(0, addressIdx),
        `${cols[addressIdx]}, ${cols[addressIdx + 1]}`,
        ...cols.slice(addressIdx + 2),
      ];
    }

    const rowData: Record<string, string> = {};
    normalizedHeaders.forEach((normKey, idx) => {
      rowData[normKey] = cols[idx] ?? "";
    });

    const gstinVal = rowData.gstin?.trim() || undefined;
    const panVal = rowData.pan?.trim() || extractPanFromGstin(gstinVal) || undefined;

    let stateVal = rowData.state?.trim() || undefined;
    let pincodeVal = rowData.pincode?.trim() || undefined;
    let contactVal = rowData.contactPerson?.trim() || undefined;

    if (pincodeVal && ALL_INDIAN_STATES_AND_UTS.some((s) => s.name.toLowerCase() === pincodeVal?.toLowerCase())) {
      if (!stateVal) stateVal = pincodeVal;
      pincodeVal = undefined;
    }

    if (contactVal && /^[1-9]\d{5}$/.test(contactVal) && !pincodeVal) {
      pincodeVal = contactVal;
      contactVal = undefined;
    }

    if (!stateVal && gstinVal) {
      stateVal = stateNameFromGstin(gstinVal) || undefined;
    }

    list.push({
      name: (rowData.name || cols[0]).trim(),
      registrationType: rowData.registrationType?.includes("composition") ? "composition" : "regular",
      gstin: gstinVal,
      pan: panVal,
      phone: rowData.phone?.trim() || undefined,
      email: rowData.email?.trim() || undefined,
      address: rowData.address?.trim() || undefined,
      city: rowData.city?.trim() || undefined,
      state: stateVal,
      pincode: pincodeVal ? pincodeVal.slice(0, 20) : undefined,
      contactPerson: contactVal,
      bankName: rowData.bankName?.trim() || undefined,
      bankAccountName: rowData.bankAccountName?.trim() || undefined,
      bankAccountNumber: rowData.bankAccountNumber?.trim() || undefined,
      bankIfsc: rowData.bankIfsc?.trim() || undefined,
      paymentTermsDays: Number(rowData.paymentTermsDays) || 30,
      leadTimeDays: Number(rowData.leadTimeDays) || 7,
      notes: rowData.notes?.trim() || undefined,
    });
  }

  return list;
}

describe("CommerceOS Vendor Import & Header Field Mapping Suite", () => {
  it("TEST 1: LabelMark Stickers exact field mapping regression test", () => {
    const csv = `Vendor Name,Registration Type,GSTIN,PAN,Phone,Email,Contact Person,Address,City,State,Pincode
LabelMark Stickers,Composition (With GST),27AADFL2201P1ZB,AADFL2201P,+91 98920 77889,hello@labelmark.in,Farhan Qureshi,"Shop 22, Dharavi Industrial Lane",Mumbai,Maharashtra,400017`;

    const vendors = parseVendorCsv(csv);
    expect(vendors).toHaveLength(1);

    const vendor = vendors[0];
    expect(vendor.name).toBe("LabelMark Stickers");
    expect(vendor.registrationType).toBe("composition");
    expect(vendor.gstin).toBe("27AADFL2201P1ZB");
    expect(vendor.pan).toBe("AADFL2201P");
    expect(vendor.phone).toBe("+91 98920 77889");
    expect(vendor.email).toBe("hello@labelmark.in");
    expect(vendor.contactPerson).toBe("Farhan Qureshi");
    expect(vendor.address).toBe("Shop 22, Dharavi Industrial Lane");
    expect(vendor.city).toBe("Mumbai");
    expect(vendor.state).toBe("Maharashtra");
    expect(vendor.pincode).toBe("400017");
  });

  it("TEST 2: Address containing unquoted comma is repaired heuristically", () => {
    const csv = `Vendor Name,Registration Type,GSTIN,PAN,Phone,Email,Contact Person,Address,City,State,Pincode
LabelMark Stickers,Composition (With GST),27AADFL2201P1ZB,AADFL2201P,+91 98920 77889,hello@labelmark.in,Farhan Qureshi,Shop 22, Dharavi Industrial Lane,Mumbai,Maharashtra,400017`;

    const vendors = parseVendorCsv(csv);
    expect(vendors).toHaveLength(1);

    const vendor = vendors[0];
    expect(vendor.contactPerson).toBe("Farhan Qureshi");
    expect(vendor.address).toBe("Shop 22, Dharavi Industrial Lane");
    expect(vendor.city).toBe("Mumbai");
    expect(vendor.state).toBe("Maharashtra");
    expect(vendor.pincode).toBe("400017");
  });

  it("TEST 3: Header order can be changed freely without breaking field mapping", () => {
    const csv = `Pincode,State,City,Address,Contact Person,Vendor Name,GSTIN
400017,Maharashtra,Mumbai,"Shop 22, Dharavi Industrial Lane",Farhan Qureshi,LabelMark Stickers,27AADFL2201P1ZB`;

    const vendors = parseVendorCsv(csv);
    expect(vendors).toHaveLength(1);

    const vendor = vendors[0];
    expect(vendor.name).toBe("LabelMark Stickers");
    expect(vendor.contactPerson).toBe("Farhan Qureshi");
    expect(vendor.address).toBe("Shop 22, Dharavi Industrial Lane");
    expect(vendor.city).toBe("Mumbai");
    expect(vendor.state).toBe("Maharashtra");
    expect(vendor.pincode).toBe("400017");
    expect(vendor.pan).toBe("AADFL2201P"); // Auto-extracted from GSTIN
  });

  it("TEST 4: Legacy vendor export sheet headers map correctly while ignoring calculated columns", () => {
    const csv = `Vendor ID,Vendor Name,Registration Type,GSTIN,PAN,Phone,Email,Contact Person,Address,City,State,Pincode,Total Bills,Total Spend,Outstanding Balance,Status
VEN-00000125,LabelMark Stickers,Composition,27AADFL2201P1ZB,AADFL2201P,+91 98920 77889,hello@labelmark.in,Farhan Qureshi,"Shop 22, Dharavi Industrial Lane",Mumbai,Maharashtra,400017,15,450000,50000,Active`;

    const vendors = parseVendorCsv(csv);
    expect(vendors).toHaveLength(1);

    const vendor = vendors[0];
    expect(vendor.name).toBe("LabelMark Stickers");
    expect(vendor.contactPerson).toBe("Farhan Qureshi");
    expect(vendor.address).toBe("Shop 22, Dharavi Industrial Lane");
    expect(vendor.city).toBe("Mumbai");
    expect(vendor.state).toBe("Maharashtra");
    expect(vendor.pincode).toBe("400017");
  });
});
