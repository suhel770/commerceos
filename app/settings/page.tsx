import AppShell from "@/components/layout/AppShell";
import BusinessProfileSettings from "@/components/settings/BusinessProfileSettings";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Your business GST drives smart Purchase tax mode"
    >
      <BusinessProfileSettings />
    </AppShell>
  );
}
