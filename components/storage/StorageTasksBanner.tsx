"use client";

import { ArrowRightLeft, AlertTriangle, ArrowRight, PackageCheck, SlidersHorizontal } from "lucide-react";

export interface StorageTaskItem {
  id: string;
  title: string;
  count: number;
  type: "receive" | "transfer" | "damage" | "adjustment";
  subtitle: string;
  badgeColor: string;
}

interface StorageTasksBannerProps {
  tasks: StorageTaskItem[];
  onTaskClick?: (task: StorageTaskItem) => void;
}

export default function StorageTasksBanner({ tasks, onTaskClick }: StorageTasksBannerProps) {
  if (!tasks || tasks.length === 0) {
    return null; // Hide completely when no tasks exist
  }

  const getTaskIcon = (type: StorageTaskItem["type"]) => {
    switch (type) {
      case "receive":
        return <PackageCheck className="h-4 w-4 text-emerald-600" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-indigo-600" />;
      case "damage":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "adjustment":
        return <SlidersHorizontal className="h-4 w-4 text-sky-600" />;
    }
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Today's Tasks ({tasks.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.slice(0, 4).map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                {getTaskIcon(task.type)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{task.title}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${task.badgeColor}`}>
                    {task.count}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">{task.subtitle}</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
