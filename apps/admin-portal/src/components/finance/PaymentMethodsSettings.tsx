"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePaymentMethods, useUpdatePaymentMethods, PaymentMethod, PaymentMethodConfig } from "../../hooks/useFinance";
import {
  Landmark,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Save,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

const TELEBIRR_VALUE = "payment_telebirr";

function MethodIcon({ value }: { value: string }) {
  if (value === TELEBIRR_VALUE)
    return <Smartphone className="h-4 w-4 text-green-600" />;
  return <Building2 className="h-4 w-4 text-blue-600" />;
}

function cardBorder(value: string, enabled: boolean) {
  if (!enabled) return "border-zinc-200 bg-zinc-50/60 opacity-60";
  if (value === TELEBIRR_VALUE) return "border-green-200 bg-green-50/40";
  return "border-blue-100 bg-blue-50/30";
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function MethodCard({ method, form, updateForm }: { method: PaymentMethod; form: any; updateForm: (updates: any) => void }) {
  const [open, setOpen] = useState(false);
  const isTelebirr = method.value === TELEBIRR_VALUE;

  if (!form) return null;

  const toggleEnabled = () => {
    updateForm({ isEnabled: !form.isEnabled });
  };

  return (
    <div className={`rounded-xl border transition-all ${cardBorder(method.value, form.isEnabled)}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isTelebirr ? "bg-green-100" : "bg-blue-100"}`}>
            <MethodIcon value={method.value} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-zinc-900 truncate">{isTelebirr ? method.description : method.note}</p>
            <p className="text-xs text-zinc-400 truncate">{isTelebirr ? method.note : "Bank Transfer"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); toggleEnabled(); }} className="flex items-center gap-1 text-xs font-medium mr-2">
            {form.isEnabled ? (
              <><ToggleRight className="h-5 w-5 text-blue-600" /><span className="text-blue-700 hidden sm:inline">On</span></>
            ) : (
              <><ToggleLeft className="h-5 w-5 text-zinc-400" /><span className="text-zinc-400 hidden sm:inline">Off</span></>
            )}
          </button>
          
          <div className="text-zinc-400 p-1">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded config */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          {isTelebirr ? (
            <>
              <Field label="Telebirr Phone Number" placeholder="e.g. 0911223344" value={form.phoneNumber} onChange={(v) => updateForm({ phoneNumber: v })} />
              <Field label="Account Name" placeholder="Name on Telebirr" value={form.accountName} onChange={(v) => updateForm({ accountName: v })} />
            </>
          ) : (
            <>
              <Field label="Bank Name" placeholder={method.note} value={form.bankName} onChange={(v) => updateForm({ bankName: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account Name" placeholder="Name on account" value={form.accountName} onChange={(v) => updateForm({ accountName: v })} />
                <Field label="Account Number" placeholder="e.g. 1000123456789" value={form.accountNumber} onChange={(v) => updateForm({ accountNumber: v })} />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Payment Instructions (shown to churches)</label>
            <textarea
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="e.g. Transfer the fee and bring the deposit slip to the finance office..."
              value={form.instructions}
              onChange={(e) => updateForm({ instructions: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentMethodsSettings() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [forms, setForms] = useState<Record<string, PaymentMethodConfig>>({});

  const { data: methods = [], isLoading } = usePaymentMethods();

  React.useEffect(() => {
    if (methods.length === 0) return;
    const initial: Record<string, any> = {};
    methods.forEach((m) => {
      // only initialize if not already in state (to avoid overwriting unsaved changes on background refetch)
      if (!forms[m.id]) {
        initial[m.id] = {
          isEnabled: m.config?.isEnabled ?? true,
          accountName: m.config?.accountName ?? "",
          accountNumber: m.config?.accountNumber ?? "",
          bankName: m.config?.bankName ?? m.note,
          phoneNumber: m.config?.phoneNumber ?? "",
          instructions: m.config?.instructions ?? "",
        };
      }
    });
    if (Object.keys(initial).length > 0) {
      setForms((prev) => ({ ...prev, ...initial }));
    }
  }, [methods]);

  const dirtyMethods = methods.filter((m) => {
    const f = forms[m.id];
    if (!f) return false;
    return (
      f.isEnabled !== (m.config?.isEnabled ?? true) ||
      f.accountName !== (m.config?.accountName ?? "") ||
      f.accountNumber !== (m.config?.accountNumber ?? "") ||
      f.bankName !== (m.config?.bankName ?? m.note) ||
      f.phoneNumber !== (m.config?.phoneNumber ?? "") ||
      f.instructions !== (m.config?.instructions ?? "")
    );
  });

  const hasChanges = dirtyMethods.length > 0;

  const { mutate: saveAllApi, isPending } = useUpdatePaymentMethods();

  const saveAll = () => {
    const payloads = dirtyMethods.map((m) => ({ id: m.id, data: forms[m.id] }));
    saveAllApi(payloads, {
      onSuccess: () => {
        toast.success("Changes saved.");
      },
      onError: () => {
        toast.error("Failed to save some changes.");
      }
    });
  };

  const telebirr = methods.filter((m) => m.value === TELEBIRR_VALUE);
  const banks = methods.filter((m) => m.value !== TELEBIRR_VALUE);

  const filterFn = (m: PaymentMethod) => {
    const isEnabled = forms[m.id]?.isEnabled ?? true;
    if (filter === "enabled") return isEnabled;
    if (filter === "disabled") return !isEnabled;
    return true;
  };

  return (
    <div className="space-y-5 relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Payment Methods</h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            Configure payment channels shown to churches. Enable the banks your council uses and enter account details.
          </p>
        </div>
        {hasChanges && (
          <button
            type="button"
            onClick={() => saveAll()}
            disabled={isPending}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition shadow-sm"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>Online gateway integration (Chapa, SantimPay) will be enabled in a future release. For now, configure your bank accounts so churches know where to send payment.</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "enabled", "disabled"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-zinc-400 animate-pulse py-6 text-center">Loading...</div>
      ) : (
        <div className="space-y-5">
          {/* Telebirr */}
          {telebirr.filter(filterFn).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Mobile Money
              </p>
              <div className="space-y-2">
                {telebirr.filter(filterFn).map((m) => (
                  <MethodCard 
                    key={m.id} 
                    method={m} 
                    form={forms[m.id]} 
                    updateForm={(updates) => setForms((prev) => ({ ...prev, [m.id]: { ...prev[m.id], ...updates } }))} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Banks */}
          {banks.filter(filterFn).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> Bank Transfers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {banks.filter(filterFn).map((m) => (
                  <MethodCard 
                    key={m.id} 
                    method={m} 
                    form={forms[m.id]} 
                    updateForm={(updates) => setForms((prev) => ({ ...prev, [m.id]: { ...prev[m.id], ...updates } }))} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Floating save bar at the bottom for easy access on long scrolls */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-4">
            <span className="text-sm font-medium">{dirtyMethods.length} unsaved changes</span>
            <button
              onClick={() => saveAll()}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
