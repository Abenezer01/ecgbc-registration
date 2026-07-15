import React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  visible?: boolean;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
  const visibleTabs = tabs.filter(t => t.visible !== false);

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              {tab.icon && (
                <span className={cn(
                  "flex items-center justify-center h-4 w-4 shrink-0", 
                  isActive ? "text-blue-500 dark:text-blue-400" : "text-zinc-400 group-hover:text-zinc-500"
                )}>
                  {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                </span>
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
