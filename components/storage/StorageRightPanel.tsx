"use client";

import StorageAdvisorPanel from "./StorageAdvisorPanel";
import StorageRecentActivity, { type ActivityEventItem } from "./StorageRecentActivity";

interface StorageRightPanelProps {
  creditsAvailable: number;
  recentEvents: ActivityEventItem[];
  onRunAnalysis: () => void;
  onAskAiFree: () => void;
  onViewHistory: () => void;
  onViewAllActivity: () => void;
}

export default function StorageRightPanel({
  creditsAvailable,
  recentEvents,
  onRunAnalysis,
  onAskAiFree,
  onViewHistory,
  onViewAllActivity,
}: StorageRightPanelProps) {
  return (
    <div className="space-y-4">
      {/* Storage Advisor */}
      <StorageAdvisorPanel
        creditsAvailable={creditsAvailable}
        onRunAnalysis={onRunAnalysis}
        onAskAiFree={onAskAiFree}
        onViewHistory={onViewHistory}
      />

      {/* Recent Activity */}
      <StorageRecentActivity events={recentEvents} onViewAll={onViewAllActivity} />
    </div>
  );
}
