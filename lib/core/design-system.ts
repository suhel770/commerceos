/**
 * CommerceOS Universal Design System V1
 * Single Source of Truth for Typography, Colors, Components, and AI Identity
 */

export const COMMERCE_OS_THEME = {
  typography: {
    display: "text-3xl font-black tracking-tight text-slate-900",
    h1: "text-2xl font-extrabold text-slate-900 tracking-tight",
    h2: "text-xl font-bold text-slate-900",
    h3: "text-lg font-bold text-slate-800",
    h4: "text-base font-semibold text-slate-800",
    bodyLarge: "text-base font-medium text-slate-700 leading-relaxed",
    body: "text-sm font-normal text-slate-600 leading-normal",
    bodySmall: "text-xs font-normal text-slate-500",
    caption: "text-[10px] font-semibold text-slate-400 uppercase tracking-widest",
    label: "text-xs font-bold text-slate-700",
    kpiValue: "text-2xl font-black text-slate-900 leading-none",
    tableHeader: "text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 px-4",
    tableCell: "text-xs font-medium text-slate-700 py-3 px-4",
    aiHeading: "text-base font-black text-purple-900 flex items-center gap-2",
    aiBody: "text-xs font-medium text-purple-800 leading-relaxed",
  },

  colors: {
    primary: "#4f46e5",
    primaryHover: "#4338ca",
    background: "#f8fafc",
    cardBg: "#ffffff",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    textMain: "#0f172a",
    textMuted: "#64748b",
  },

  semantic: {
    success: {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    warning: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      pill: "bg-amber-100 text-amber-800 border-amber-200",
    },
    danger: {
      text: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      pill: "bg-rose-100 text-rose-800 border-rose-200",
    },
    info: {
      text: "text-sky-700",
      bg: "bg-sky-50",
      border: "border-sky-200",
      pill: "bg-sky-100 text-sky-800 border-sky-200",
    },
  },

  /**
   * Universal CommerceOS AI Identity
   * Universal purple/violet brand with amber spark accent across ALL modules
   */
  aiIdentity: {
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    surface: "bg-purple-50/60",
    surfaceElevated: "bg-white",
    border: "border-purple-200",
    borderStrong: "border-purple-300",
    textPrimary: "text-purple-950",
    textMuted: "text-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1",
    buttonPrimary: "bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-2",
    buttonSecondary: "bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5",
    tagFree: "bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
    tagCredit: "bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
  },

  components: {
    card: "bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm",
    buttonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer",
    buttonSecondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer",
    input: "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300",
    table: "w-full text-left border-collapse",
    badge: "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border",
  },
} as const;
