"use client";

import React from "react";
import { useFinanceSummary } from "../../../hooks/useFinance";
import { FinanceSummaryCards } from "../../../components/finance/FinanceSummaryCards";
import { FeeTable } from "../../../components/finance/FeeTable";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

export default function FinanceDashboardPage() {
  const { data, isLoading } = useFinanceSummary();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_finance");

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Financial Overview
        </h2>

        {isLoading ? (
          <FinanceSummaryCards summary={{} as any} isLoading={true} />
        ) : (
          <div className="space-y-6">
            {data?.summaries?.map((summary) => (
              <div key={summary.currency}>
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {summary.currency} Summary
                </h3>
                <FinanceSummaryCards summary={summary} isLoading={false} />
              </div>
            ))}
            {!data?.summaries?.length && (
              <FinanceSummaryCards summary={{ currency: 'ETB' } as any} isLoading={false} />
            )}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Recent Fee Activity
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/finance/fees")}
          >
            View All Fees
          </Button>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <FeeTable
            fees={data?.recentFees || []}
            isLoading={isLoading}
            onSendClick={() => router.push("/finance/fees")}
            onPayClick={() => router.push("/finance/fees")}
            onVerifyClick={() => router.push("/finance/fees")}
            canManage={canManage}
          />
        </div>
      </section>
    </div>
  );
}