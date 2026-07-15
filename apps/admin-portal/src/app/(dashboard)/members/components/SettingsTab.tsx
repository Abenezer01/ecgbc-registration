import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

interface SettingsTabProps {
  member: any;
}

export function SettingsTab({ member }: SettingsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      
      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
        
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6 max-w-xl">
          Deactivating this member will prevent them from accessing any services and will mark their status as inactive across the entire system. This action can be reversed by a super administrator.
        </p>
        
        <div className="flex items-center gap-4">
          <Button variant="danger" className="font-semibold shadow-sm shadow-red-200 dark:shadow-none">
            Deactivate Member
          </Button>
        </div>
      </div>

    </div>
  );
}
