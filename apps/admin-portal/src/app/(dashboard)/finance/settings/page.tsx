"use client";

import React, { useState } from "react";
import { FeeRulesManager } from "../../../../components/finance/FeeRulesManager";
import { PaymentMethodsSettings } from "../../../../components/finance/PaymentMethodsSettings";
import { Percent, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "fee-rules", label: "Fee Rules", icon: Percent },
  { key: "payment-methods", label: "Payment Methods", icon: CreditCard },
];

export default function FinanceSettingsPage() {
  const [activeTab, setActiveTab] = useState("fee-rules");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "fee-rules" && <FeeRulesManager />}
      {activeTab === "payment-methods" && <PaymentMethodsSettings />}
    </div>
  );
}
