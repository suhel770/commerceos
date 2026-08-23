import AppShell from "@/components/layout/AppShell";
import UniversalAiWorkspace from "@/components/ai/UniversalAiWorkspace";

export const metadata = {
  title: "AI Reports & Intelligence — CommerceOS",
  description: "Enterprise AI Credit, Executive Reports, Monetization & ROI Platform.",
};

export default function UniversalAiRoutePage() {
  return (
    <AppShell
      title="AI Reports & Intelligence"
      subtitle="Universal AI Engine — Credit System, Saved Reports & Executive Business Audits"
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 pb-6 pt-3">
        <UniversalAiWorkspace />
      </div>
    </AppShell>
  );
}
