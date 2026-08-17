"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import ActionStateTimeline from "./ActionStateTimeline";
import { ACTION_STATE_COLORS, type ActionStateEntity } from "@/hooks/useActionStates";

interface Props {
  entityType: ActionStateEntity;
  entityId: string;
  currentActionState?: string | null;
  trigger?: React.ReactNode;
}

export default function ActionStateDrawer({
  entityType,
  entityId,
  currentActionState,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const state = currentActionState || "REGISTERED";
  const colorClass = ACTION_STATE_COLORS[state] || "text-zinc-500 bg-zinc-50 border-zinc-200 hover:bg-zinc-100";

  const defaultTrigger = (
    <button
      type="button"
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${colorClass}`}
    >
      {state}
    </button>
  );

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="inline-block cursor-pointer">
        {trigger || defaultTrigger}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Approval State History"
        description={`View and manage the approval workflow for this ${entityType.toLowerCase()}.`}
        size="md"
      >
        <div className="p-6">
          <ActionStateTimeline
            entityType={entityType}
            entityId={entityId}
            currentActionState={currentActionState}
          />
        </div>
      </Drawer>
    </>
  );
}
