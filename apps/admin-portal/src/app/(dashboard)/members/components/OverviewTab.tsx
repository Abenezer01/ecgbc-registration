import React from "react";
import { Phone, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

interface OverviewTabProps {
  member: any;
}

export function OverviewTab({ member }: OverviewTabProps) {
  const m = member;
  const boardMembers = m.boardMembers || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Board Members */}
      {boardMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            Board Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardMembers.map((bm: any, idx: number) => (
              <Card key={idx} className="bg-white dark:bg-zinc-900/50 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {bm.fullName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                      {bm.fullName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {bm.phoneNumber || "No phone provided"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {boardMembers.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 text-sm">No board members found.</p>
        </div>
      )}
    </div>
  );
}
