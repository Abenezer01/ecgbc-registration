"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";
import { Search, AlertTriangle, GitFork, X, Loader2, Check } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface SplitChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMember: { id: string; name: string; certificateNo: string };
  onSuccess: () => void;
}

interface MemberOption {
  id: string;
  name: string;
  certificateNo: string;
  city?: string;
  isActive: boolean;
}

export function SplitChurchModal({ isOpen, onClose, parentMember, onSuccess }: SplitChurchModalProps) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<MemberOption[]>([]);
  const [selectedDaughters, setSelectedDaughters] = useState<MemberOption[]>([]);
  const [parentDisposition, setParentDisposition] = useState<"KEEP_ACTIVE" | "MARK_SPLIT">("KEEP_ACTIVE");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setCandidates([]);
      setSelectedDaughters([]);
      setParentDisposition("KEEP_ACTIVE");
      setReason("");
      setNotes("");
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      return;
    }
  }, [isOpen]);

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
        const filtered = list.filter(
          (m: any) =>
            m.id !== parentMember.id &&
            !selectedDaughters.some((s) => s.id === m.id)
        );
        setCandidates(filtered);
      } catch (err) {
        console.error("Failed to search members for split", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, parentMember.id, selectedDaughters]);

  const handleSelect = (member: MemberOption) => {
    setSelectedDaughters((prev) => [...prev, member]);
    setSearch("");
    setCandidates([]);
  };

  const handleRemove = (id: string) => {
    setSelectedDaughters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedDaughters.length === 0) {
      toast.error("Please select at least one daughter church to establish split lineage");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide an official reason or resolution for the split/branching");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/members/${parentMember.id}/split`, {
        daughterMemberIds: selectedDaughters.map((c) => c.id),
        parentDisposition,
        effectiveDate,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      toast.success("Split / Branching recorded successfully! Lineage established.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to execute split");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Split / Branch Daughter Churches" size="lg">
      <div className="space-y-5">
        {/* Banner */}
        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 flex items-start gap-3 text-xs text-purple-800 dark:text-purple-300">
          <GitFork className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Parent / Mother Church: {parentMember.name} ({parentMember.certificateNo})
            </p>
            <p className="text-purple-700 dark:text-purple-400 leading-relaxed">
              Link one or more daughter churches established from this church. All historical lineage
              is preserved on both mother and daughter church records.
            </p>
          </div>
        </div>

        {/* Daughter Church Search and Select */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Select Daughter Churches *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by daughter church name or certificate..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 animate-spin" />
            )}
          </div>

          {/* Candidates dropdown */}
          {candidates.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md divide-y divide-neutral-100 dark:divide-neutral-700">
              {candidates.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{c.name}</p>
                    <p className="text-neutral-400">
                      Cert: {c.certificateNo} {c.city ? `• ${c.city}` : ""}
                    </p>
                  </div>
                  <span className="text-purple-600 font-medium flex items-center gap-1">
                    Select <Check size={12} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Daughter Churches Chips */}
          {selectedDaughters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedDaughters.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  <GitFork size={12} className="text-purple-600" />
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

        {/* Mother Church Disposition */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Mother Church Status After Split
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                parentDisposition === "KEEP_ACTIVE"
                  ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <input
                type="radio"
                name="parentDisposition"
                value="KEEP_ACTIVE"
                checked={parentDisposition === "KEEP_ACTIVE"}
                onChange={() => setParentDisposition("KEEP_ACTIVE")}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-neutral-900 dark:text-white">Keep Mother Church Active</p>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Church continues operating as central body alongside the newly planted branches.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                parentDisposition === "MARK_SPLIT"
                  ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <input
                type="radio"
                name="parentDisposition"
                value="MARK_SPLIT"
                checked={parentDisposition === "MARK_SPLIT"}
                onChange={() => setParentDisposition("MARK_SPLIT")}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-neutral-900 dark:text-white">Dissolve Mother Church</p>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Mark mother church as SPLIT/inactive; congregation is fully divided into daughter churches.
                </p>
              </div>
            </label>
          </div>
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Split Justification / Resolution *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Branch Planting Resolution #208"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
            placeholder="Geographic branch boundary notes, pastoral assignment, etc..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || selectedDaughters.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <GitFork className="mr-2 h-4 w-4" />}
          {submitting ? "Processing..." : `Confirm Split (${selectedDaughters.length} Daughters)`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
