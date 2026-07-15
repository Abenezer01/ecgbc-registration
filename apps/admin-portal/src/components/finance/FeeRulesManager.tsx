"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Settings2, Search } from "lucide-react";
import { DataTable, Button, Modal, ModalFooter, FormField, Input, Checkbox } from "@/components/ui";
import { useFeeRules, useCreateFeeRule, useUpdateFeeRule, useDeleteFeeRule, FeeRuleData } from "../../hooks/useFeeRules";
import { useDataLookups } from "../../hooks/useDataLookups";
import { useFellowships } from "../../hooks/useFellowships";
import { useReportRequests } from "../../hooks/useReportRequests";
import toast from "react-hot-toast";

export function FeeRulesManager() {
  const { data: rules = [], isLoading } = useFeeRules();
  const { data: lookups } = useDataLookups();
  const { data: fellowshipsData } = useFellowships({ limit: 200 });
  const { data: reportRequestsData } = useReportRequests(1, 100);

  const createRule = useCreateFeeRule();
  const updateRule = useUpdateFeeRule();
  const deleteRule = useDeleteFeeRule();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRuleData | null>(null);
  const [fellowshipSearch, setFellowshipSearch] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [memberTypeId, setMemberTypeId] = useState("");
  const [memberCategoryId, setMemberCategoryId] = useState("");
  const [fellowshipIds, setFellowshipIds] = useState<string[]>([]);
  const [reportRequestId, setReportRequestId] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [amount, setAmount] = useState("");
  const [lateFeeMultiplier, setLateFeeMultiplier] = useState("");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const memberTypes = (lookups || []).filter((l) => l.type.toLowerCase() === "member_type" || l.type.toLowerCase() === "member type");
  const memberCategories = (lookups || []).filter((l) => l.type.toLowerCase() === "member_category" || l.type.toLowerCase() === "member category" || l.category?.toLowerCase() === "member_category");
  const allFellowships = fellowshipsData?.fellowships || [];
  const requests = reportRequestsData?.requests || [];

  const filteredFellowships = fellowshipSearch
    ? allFellowships.filter((f) => f.name.toLowerCase().includes(fellowshipSearch.toLowerCase()))
    : allFellowships;

  const toggleFellowship = (id: string) => {
    setFellowshipIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setName("");
    setMemberTypeId("");
    setMemberCategoryId("");
    setFellowshipIds([]);
    setFellowshipSearch("");
    setReportRequestId("");
    setCurrency("ETB");
    setAmount("");
    setLateFeeMultiplier("");
    setPriority(0);
    setIsActive(true);
    setEditingRule(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (rule: FeeRuleData) => {
    setEditingRule(rule);
    setName(rule.name);
    setMemberTypeId(rule.memberTypeId || "");
    setMemberCategoryId(rule.memberCategoryId || "");
    setFellowshipIds(rule.fellowships?.map((f) => f.id) || []);
    setFellowshipSearch("");
    setReportRequestId(rule.reportRequestId || "");
    setCurrency(rule.currency);
    setAmount(rule.amount.toString());
    setLateFeeMultiplier(rule.lateFeeMultiplier?.toString() || "");
    setPriority(rule.priority);
    setIsActive(rule.isActive);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !amount) {
      toast.error("Name and amount are required");
      return;
    }

    const payload = {
      name,
      memberTypeId: memberTypeId || null,
      memberCategoryId: memberCategoryId || null,
      fellowshipIds,
      reportRequestId: reportRequestId || null,
      currency,
      amount,
      lateFeeMultiplier: lateFeeMultiplier || null,
      priority: Number(priority),
      isActive,
    };

    try {
      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...payload });
        toast.success("Rule updated successfully");
      } else {
        await createRule.mutateAsync(payload);
        toast.success("Rule created successfully");
      }
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save rule");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this fee rule?")) {
      try {
        await deleteRule.mutateAsync(id);
        toast.success("Deleted successfully");
      } catch {
        toast.error("Failed to delete rule");
      }
    }
  };

  const columns = [
    {
      key: "name",
      header: "Rule Name",
      cell: (row: FeeRuleData) => (
        <div>
          <p className="font-semibold text-zinc-900">{row.name}</p>
          <p className="text-xs text-zinc-500">Priority: {row.priority}</p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope (Filters)",
      cell: (row: FeeRuleData) => (
        <div className="flex flex-wrap gap-1">
          {row.reportRequest ? <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs truncate max-w-[120px]">Req: {row.reportRequest.title}</span> : null}
          {row.memberType ? <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-xs truncate max-w-[100px]">Type: {row.memberType.description}</span> : null}
          {row.memberCategory ? <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs truncate max-w-[100px]">Cat: {row.memberCategory.description}</span> : null}
          {row.fellowships && row.fellowships.length > 0 ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">
              {row.fellowships.length === 1
                ? row.fellowships[0].name
                : `${row.fellowships.length} Fellowships`}
            </span>
          ) : null}
          {!row.reportRequest && !row.memberType && !row.memberCategory && (!row.fellowships || row.fellowships.length === 0) && (
            <span className="text-xs text-zinc-400">Global (Applies to all)</span>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: FeeRuleData) => (
        <div>
          <p className="font-semibold text-zinc-900">{row.currency} {Number(row.amount).toLocaleString()}</p>
          {row.lateFeeMultiplier && <p className="text-xs text-amber-600">Late: {row.lateFeeMultiplier}x</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: FeeRuleData) => (
        row.isActive
          ? <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
          : <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full font-medium">Inactive</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: FeeRuleData) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)} className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4 text-zinc-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-500" /> Fee Rules Engine
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Configure how reporting fees are calculated based on member types and categories.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        rowKey={(row) => row.id}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? "Edit Fee Rule" : "Create Fee Rule"}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 py-2">
          <FormField id="name" label="Rule Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Report - Addis Churches" />
          </FormField>

          <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div>
              <h4 className="text-sm font-medium text-zinc-900 mb-1">Scope / Filters</h4>
              <p className="text-xs text-zinc-500">Leave blank to apply to all members. More specific rules override global ones.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField id="reportRequest" label="Target Report Request">
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={reportRequestId}
                  onChange={(e) => setReportRequestId(e.target.value)}
                >
                  <option value="">Any (Global)</option>
                  {requests.map(req => <option key={req.id} value={req.id}>{req.title}</option>)}
                </select>
              </FormField>

              <FormField id="memberType" label="Member Type">
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={memberTypeId}
                  onChange={(e) => setMemberTypeId(e.target.value)}
                >
                  <option value="">Any Type</option>
                  {memberTypes.map(m => <option key={m.id} value={m.id}>{m.description || m.value}</option>)}
                </select>
              </FormField>

              <FormField id="memberCat" label="Member Category">
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={memberCategoryId}
                  onChange={(e) => setMemberCategoryId(e.target.value)}
                >
                  <option value="">Any Category</option>
                  {memberCategories.map(m => <option key={m.id} value={m.id}>{m.description || m.value}</option>)}
                </select>
              </FormField>
            </div>

            {/* Multi-select fellowship list */}
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">
                Fellowships
                {fellowshipIds.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {fellowshipIds.length} selected
                  </span>
                )}
              </label>
              <p className="text-xs text-zinc-400 mb-2">Leave all unchecked to apply to all fellowships.</p>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search fellowships..."
                  value={fellowshipSearch}
                  onChange={(e) => setFellowshipSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100">
                {filteredFellowships.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">No fellowships found</p>
                ) : (
                  filteredFellowships.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={fellowshipIds.includes(f.id)}
                        onChange={() => toggleFellowship(f.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-700 group-hover:text-zinc-900 truncate">{f.name}</span>
                    </label>
                  ))
                )}
              </div>
              {fellowshipIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFellowshipIds([])}
                  className="mt-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="currency" label="Currency">
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
              </select>
            </FormField>

            <FormField id="amount" label="Base Fee Amount" required>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField id="lateFee" label="Late Fee Multiplier (Optional)">
              <Input type="number" step="0.01" value={lateFeeMultiplier} onChange={(e) => setLateFeeMultiplier(e.target.value)} placeholder="e.g. 1.5 for 50% extra" />
              <p className="text-[10px] text-zinc-500 mt-1">Multiplies the base amount if submitted after the due date.</p>
            </FormField>

            <FormField id="priority" label="Priority Score" required>
              <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
              <p className="text-[10px] text-zinc-500 mt-1">Higher numbers win if multiple rules match.</p>
            </FormField>
          </div>

          <div className="pt-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={(e: any) => setIsActive(e.target.checked)}
              label="Rule is active"
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={createRule.isPending || updateRule.isPending}>
              {createRule.isPending || updateRule.isPending ? "Saving..." : "Save Rule"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
