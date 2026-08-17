"use client";
import { useState } from "react";
import { CheckCircle2, Clock, Shield, ChevronRight, Loader2 } from "lucide-react";
import {
  useActionStates,
  useCreateActionState,
  getNextState,
  ACTION_STATE_COLORS,
  ACTION_STATE_MACHINES,
  type ActionStateEntity,
} from "@/hooks/useActionStates";

const STATE_ICONS: Record<string, React.ReactNode> = {
  REGISTERED: <Clock className="h-4 w-4" />,
  CHECKED:    <CheckCircle2 className="h-4 w-4" />,
  APPROVED:   <Shield className="h-4 w-4" />,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  entityType: ActionStateEntity;
  entityId: string;
  currentActionState?: string | null;
}

export default function ActionStateTimeline({ entityType, entityId, currentActionState }: Props) {
  const { data: history = [], isLoading } = useActionStates(entityType, entityId);
  const { mutateAsync: advanceState, isPending } = useCreateActionState(entityType, entityId);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");

  const current = currentActionState || (history.length > 0 ? history[0].state : null);
  const nextState = current ? getNextState(entityType, current) : (ACTION_STATE_MACHINES[entityType]?.[0] ?? null);
  const colorClass = current ? (ACTION_STATE_COLORS[current] ?? "") : "";

  async function handleAdvance() {
    if (!nextState) return;
    await advanceState({ state: nextState, note: note.trim() || undefined });
    setNote("");
    setShowModal(false);
  }

  return (
    <div className="space-y-4">
      {/* Current State Badge + Advance Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Current Status</span>
          {current ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
              {STATE_ICONS[current] ?? <Clock className="h-3 w-3" />}
              {current}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
        </div>
        {nextState && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Advance to {nextState}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {!nextState && current && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">? Final State</span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4">No history yet.</p>
        ) : (
          history.map((entry, i) => {
            const isLast = i === history.length - 1;
            const color = ACTION_STATE_COLORS[entry.state] ?? "";
            return (
              <div key={entry.id} className="flex gap-3">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <span className={`flex items-center justify-center h-7 w-7 rounded-full border-2 shrink-0 ${color}`}>
                    {STATE_ICONS[entry.state] ?? <Clock className="h-3.5 w-3.5" />}
                  </span>
                  {!isLast && <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 my-1" />}
                </div>
                {/* Content */}
                <div className={`pb-4 ${isLast ? "" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{entry.state}</span>
                    <span className="text-xs text-zinc-400">—</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {entry.staff.firstName} {entry.staff.lastName}
                    </span>
                    <span className="text-xs text-zinc-400">—</span>
                    <span className="text-xs text-zinc-400">{formatDate(entry.performedAt)}</span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 italic">&ldquo;{entry.note}&rdquo;</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Advance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Advance to <span className="text-blue-600 dark:text-blue-400">{nextState}</span>
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Add an optional note to explain this state change.
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowModal(false); setNote(""); }}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvance}
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
