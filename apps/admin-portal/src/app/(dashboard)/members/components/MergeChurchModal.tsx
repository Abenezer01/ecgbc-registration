"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, FormField } from "@/components/ui";
import { Search, AlertTriangle, GitMerge, X, Loader2, Check, Building2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { ChurchSearchPicker, MemberOption } from "./ChurchSearchPicker";

interface MergeChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember?: { id: string; name: string; certificateNo: string } | null;
  initialSelectedChurches?: MemberOption[];
  onSuccess: () => void;
}

export function MergeChurchModal({
  isOpen,
  onClose,
  targetMember,
  initialSelectedChurches = [],
  onSuccess,
}: MergeChurchModalProps) {
  const [currentTarget, setCurrentTarget] = useState<MemberOption | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<MemberOption[]>([]);
  const [selectedChurches, setSelectedChurches] = useState<MemberOption[]>([]);
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentTarget(null);
      setSearch("");
      setCandidates([]);
      setSelectedChurches([]);
      setReason("");
      setNotes("");
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      return;
    }

    if (initialSelectedChurches.length >= 2) {
      // Multi-select merge mode: first church is default surviving entity, rest are absorbed
      setCurrentTarget(initialSelectedChurches[0]);
      setSelectedChurches(initialSelectedChurches.slice(1));
    } else if (targetMember) {
      setCurrentTarget({
        id: targetMember.id,
        name: targetMember.name,
        certificateNo: targetMember.certificateNo,
        isActive: true,
      });
      setSelectedChurches([]);
    } else {
      setCurrentTarget(null);
      setSelectedChurches([]);
    }
  }, [isOpen, targetMember, initialSelectedChurches]);

  // Search members debounce
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/members", {
          params: { search: search.trim(), pageSize: 10 },
        });
        const list = res.data?.data?.members || [];
        // Filter out target member and already selected members
        const filtered = list.filter(
          (m: any) =>
            m.id !== currentTarget?.id &&
            !selectedChurches.some((s: MemberOption) => s.id === m.id)
        );
        setCandidates(filtered);
      } catch (err) {
        console.error("Failed to search members for merge", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentTarget?.id, selectedChurches]);

  const handleSelect = (member: MemberOption) => {
    setSelectedChurches((prev: MemberOption[]) => [...prev, member]);
    setSearch("");
    setCandidates([]);
  };

  const handleRemove = (id: string) => {
    setSelectedChurches((prev: MemberOption[]) => prev.filter((c: MemberOption) => c.id !== id));
  };

  const handleSurvivingChange = (survivor: MemberOption) => {
    if (!initialSelectedChurches.length) {
      setCurrentTarget(survivor);
      return;
    }
    // Update surviving entity and make all other initial selected churches candidates
    setCurrentTarget(survivor);
    const others = initialSelectedChurches.filter((c: MemberOption) => c.id !== survivor.id);
    setSelectedChurches(others);
  };

  const handleSubmit = async () => {
    if (!currentTarget) {
      toast.error("Please select the surviving target church");
      return;
    }
    if (selectedChurches.length === 0) {
      toast.error("Please select at least one predecessor church to merge");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide an official reason or resolution for the merger");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/members/${currentTarget.id}/merge`, {
        predecessorIds: selectedChurches.map((c: MemberOption) => c.id),
        effectiveDate,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      toast.success("Merger executed successfully! Lineage established.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to execute merger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Combine / Merge Churches" size="lg">
      <div className="space-y-5">
        {/* Multi-Selection Mode: Pick surviving entity */}
        {initialSelectedChurches.length >= 2 ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Step 1: Choose Surviving Entity (Absorbing Church) *
            </label>
            <p className="text-xs text-neutral-500">
              Select which of the {initialSelectedChurches.length} selected churches will remain active. The other church(es) will be merged into it with full historical retention.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {initialSelectedChurches.map((c) => {
                const isSelected = currentTarget?.id === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => handleSurvivingChange(c)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-colors ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-neutral-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Cert: {c.certificateNo || "None"}</p>
                    </div>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-semibold">
                        Surviving
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Single / Standalone Mode: Church Picker for Surviving Target */
          <ChurchSearchPicker
            selectedChurch={currentTarget}
            onSelectChurch={setCurrentTarget}
            disabled={!!targetMember}
            label="Step 1: Surviving Target Church (Remains Active) *"
            placeholder="Search surviving church name or certificate number..."
            required
          />
        )}

        {/* Banner */}
        {currentTarget && (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Merging into: {currentTarget.name} ({currentTarget.certificateNo})
              </p>
              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                Selected predecessor churches will be deactivated and marked as <strong>MERGED</strong>.
                Their historical reports, certificates, and files are permanently preserved as predecessor lineage.
              </p>
            </div>
          </div>
        )}

        {/* Church Search and Select */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Select Predecessor Churches to Merge *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by church name or certificate number..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {candidates.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md divide-y divide-neutral-100 dark:divide-neutral-700">
              {candidates.map((c: MemberOption) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{c.name}</p>
                    <p className="text-neutral-400">
                      Cert: {c.certificateNo} {c.city ? `• ${c.city}` : ""}
                    </p>
                  </div>
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    Select <Check size={12} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Churches Chips */}
          {selectedChurches.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedChurches.map((c: MemberOption) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  <GitMerge size={12} className="text-amber-600" />
                  <span>{c.name} ({c.certificateNo})</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    className="hover:text-red-500 text-neutral-400 ml-1"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Effective Date & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Merger Justification / Resolution *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. General Assembly Resolution #412"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
            Additional Administrative Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details regarding asset absorption, council notification, or committee notes..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !currentTarget || selectedChurches.length === 0}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <GitMerge className="mr-2 h-4 w-4" />}
          {submitting ? "Merging..." : `Confirm Merger (${selectedChurches.length})`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
