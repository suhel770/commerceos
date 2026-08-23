"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building,
  Factory,
  Globe,
  Home,
  Layers,
  Package,
  ShoppingBag,
  Store,
  Truck,
  Warehouse,
  X,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Briefcase,
  ChevronDown,
  Check,
  Phone,
  User,
  Sparkles,
} from "lucide-react";
import type { StorageLocationType } from "@/lib/storage/domain/types";

export interface SubLocationConfigData {
  bays: number;
  racks: number;
  shelves: number;
  binsPerShelf: number;
  totalBins: number;
}

export interface WarehouseEmployee {
  id: string;
  name: string;
  designation: string;
  phone?: string;
}

interface CreateStorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: StorageLocationType;
    fcReferenceCode?: string;
    isDefault?: boolean;
    subLocationConfig?: SubLocationConfigData;
    employees?: WarehouseEmployee[];
  }) => void;
}

interface CustomDesignationSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function getDesignationBadgeStyle(designation: string) {
  const d = designation.toLowerCase();
  if (d.includes("manager") || d.includes("lead") || d.includes("head")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  }
  if (d.includes("supervisor") || d.includes("incharge")) {
    return "bg-amber-50 text-amber-800 border-amber-200/80";
  }
  if (d.includes("qc") || d.includes("receiving") || d.includes("inward")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (d.includes("operator") || d.includes("pack") || d.includes("dispatch")) {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function CustomDesignationSelect({ value, onChange, options }: CustomDesignationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-white hover:border-indigo-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Briefcase className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{value}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 bottom-full mb-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-0.5 animate-in fade-in duration-100 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
          <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Role / Designation
          </div>
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-900 font-black"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{opt}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateStorageLocationModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateStorageLocationModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<StorageLocationType>("warehouse");
  const [fcCode, setFcCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Sub-location Matrix state
  const [enableSubLocations, setEnableSubLocations] = useState(false);
  const [bays, setBays] = useState(2);
  const [racks, setRacks] = useState(4);
  const [shelves, setShelves] = useState(3);
  const [binsPerShelf, setBinsPerShelf] = useState(2);

  // Employees state (Optional - Master User feature)
  const [enableStaff, setEnableStaff] = useState(false);
  const [employees, setEmployees] = useState<WarehouseEmployee[]>([]);
  const [empName, setEmpName] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empDesignation, setEmpDesignation] = useState("Warehouse Manager");

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalBins = (bays || 1) * (racks || 1) * (shelves || 1) * (binsPerShelf || 1);

  const handleAddEmployee = () => {
    if (!empName.trim()) return;
    const newEmp: WarehouseEmployee = {
      id: `emp-${Date.now()}`,
      name: empName.trim(),
      phone: empPhone.trim() || undefined,
      designation: empDesignation,
    };
    setEmployees((prev) => [...prev, newEmp]);
    setEmpName("");
    setEmpPhone("");
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subConfig: SubLocationConfigData | undefined =
      enableSubLocations && (type === "warehouse" || type === "home_storage" || type === "factory")
        ? {
            bays: Math.max(1, bays),
            racks: Math.max(1, racks),
            shelves: Math.max(1, shelves),
            binsPerShelf: Math.max(1, binsPerShelf),
            totalBins,
          }
        : undefined;

    onSubmit({
      name: name.trim(),
      type,
      fcReferenceCode: fcCode.trim() || undefined,
      isDefault,
      subLocationConfig: subConfig,
      employees: enableStaff && employees.length > 0 ? employees : undefined,
    });
    onClose();
    setName("");
    setFcCode("");
    setType("warehouse");
    setEnableSubLocations(false);
    setEnableStaff(false);
    setEmployees([]);
    setEmpName("");
    setEmpPhone("");
  };

  const locationTypes: { type: StorageLocationType; label: string; icon: any }[] = [
    { type: "warehouse", label: "Own Warehouse", icon: Warehouse },
    { type: "home_storage", label: "Home Storage", icon: Home },
    { type: "amazon_fba", label: "Amazon FBA", icon: ShoppingBag },
    { type: "flipkart_fulfillment", label: "Flipkart FBF", icon: ShoppingBag },
    { type: "3pl", label: "3PL Partner", icon: Truck },
    { type: "retail_store", label: "Retail Store", icon: Store },
    { type: "factory", label: "Factory Plant", icon: Factory },
    { type: "temporary_storage", label: "Temporary Buffer", icon: Building },
    { type: "custom", label: "Custom Node", icon: Globe },
  ];

  const supportsBins = type === "warehouse" || type === "home_storage" || type === "factory";

  const designationOptions = [
    "Warehouse Manager",
    "Assistant Warehouse Manager",
    "Inventory Supervisor",
    "Inwarding & QC Lead",
    "Receiving Associate",
    "Pick & Pack Operator",
    "Dispatch & Logistics Officer",
    "Security & Gate Incharge",
    "Operations Lead",
    "Facility Associate",
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 px-6 shrink-0 bg-white">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Add Storage Location</h2>
            <p className="text-xs font-medium text-slate-500">Register a new physical or marketplace stock node</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body with Custom Sleek Scrollbar */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                Location Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {locationTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setType(item.type);
                        if (item.type === "warehouse") setEnableSubLocations(true);
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center text-xs font-bold transition-all border ${
                        isSelected
                          ? "border-violet-600 bg-violet-50 text-violet-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-violet-600" : "text-slate-400"}`} />
                      <span className="text-[11px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Location Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === "warehouse" ? "e.g. Delhi Main Warehouse Hub" : "e.g. Koramangala Home Room"}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-violet-600 focus:outline-none"
              />
            </div>

            {(type === "amazon_fba" || type === "flipkart_fulfillment" || type === "3pl") && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  FC / Hub Reference Code (Optional)
                </label>
                <input
                  type="text"
                  value={fcCode}
                  onChange={(e) => setFcCode(e.target.value)}
                  placeholder="e.g. DEL4, BOM1, BLR2"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-violet-600 focus:outline-none"
                />
              </div>
            )}

            {/* Sub-location Matrix Config for Own Warehouse / Home Storage */}
            {supportsBins && (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableSubLocations"
                    checked={enableSubLocations}
                    onChange={(e) => setEnableSubLocations(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <label
                    htmlFor="enableSubLocations"
                    className="text-xs font-black text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="h-4 w-4 text-violet-600" />
                    Configure Bays, Racks, Shelves & Bins Layout
                  </label>
                </div>

                {enableSubLocations && (
                  <div className="space-y-3 pt-1 border-t border-violet-100 animate-in fade-in duration-150">
                    <p className="text-[11px] font-medium text-slate-500">
                      Define internal Bays, Racks, Shelves, and Storage Bin matrix for this facility.
                    </p>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Bays
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={bays}
                          onChange={(e) => setBays(parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-slate-900 focus:border-violet-600 focus:outline-none text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Racks/Bay
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={racks}
                          onChange={(e) => setRacks(parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-slate-900 focus:border-violet-600 focus:outline-none text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Shelves/Rack
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={shelves}
                          onChange={(e) => setShelves(parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-slate-900 focus:border-violet-600 focus:outline-none text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Bins/Shelf
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={binsPerShelf}
                          onChange={(e) => setBinsPerShelf(parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-slate-900 focus:border-violet-600 focus:outline-none text-center"
                        />
                      </div>
                    </div>

                    {/* Summary preview */}
                    <div className="rounded-xl bg-white p-2.5 border border-violet-200/60 flex items-center justify-between text-xs font-bold text-violet-900">
                      <span>Generated Sub-locations:</span>
                      <span className="bg-violet-100 px-2 py-0.5 rounded-lg text-violet-800 font-extrabold text-[11px]">
                        {totalBins} Bins ({bays} Bays × {racks} Racks)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Facility Staff Assignment (Master User Feature) */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-slate-100/40 p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="enableStaff"
                    checked={enableStaff}
                    onChange={(e) => setEnableStaff(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="enableStaff"
                    className="text-xs font-black text-slate-900 flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Assign Employees & Staff Roles (Optional)</span>
                  </label>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-200/60 shrink-0">
                  <Shield className="h-2.5 w-2.5" />
                  Master Admin Only
                </span>
              </div>

              {enableStaff && (
                <div className="space-y-3.5 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                    Assign warehouse managers, supervisors, and on-ground operators to oversee inventory & fulfillment at this facility.
                  </p>

                  {/* Add Employee Form Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Name Input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Employee Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={empName}
                            onChange={(e) => setEmpName(e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Phone / Mobile Input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="tel"
                            value={empPhone}
                            onChange={(e) => setEmpPhone(e.target.value)}
                            placeholder="e.g. 98765 43210"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Designation and Add Button Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 pt-0.5">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Designation / Role
                        </label>
                        <CustomDesignationSelect
                          value={empDesignation}
                          onChange={setEmpDesignation}
                          options={designationOptions}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddEmployee}
                        disabled={!empName.trim()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>

                  {/* Assigned Employees List */}
                  {employees.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-0.5">
                        <span>Assigned Staff ({employees.length})</span>
                        <span className="text-[10px] text-slate-400 normal-case font-medium">Saved with this location</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                        {employees.map((emp) => {
                          const initials = emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "ST";
                          const badgeStyle = getDesignationBadgeStyle(emp.designation);

                          return (
                            <div
                              key={emp.id}
                              className="flex items-center justify-between rounded-xl bg-white p-2.5 px-3 border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-indigo-100/90 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 truncate">{emp.name}</span>
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${badgeStyle}`}>
                                      {emp.designation}
                                    </span>
                                  </div>
                                  {emp.phone && (
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span>{emp.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmployee(emp.id)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0 ml-2"
                                title="Remove staff member"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2.5 px-4 rounded-xl border border-dashed border-slate-200 bg-white/70">
                      <p className="text-[11px] font-medium text-slate-500">
                        No staff assigned yet. Enter name, mobile, and designation above to assign.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-xs font-bold text-slate-700 cursor-pointer">
                Set as Primary Storage Location
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition-colors"
            >
              Register Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
