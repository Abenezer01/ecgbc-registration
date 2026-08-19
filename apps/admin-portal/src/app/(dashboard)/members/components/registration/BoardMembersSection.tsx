import React from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { FormField, Input, Select, Button, PhoneInput, RowActions, presets } from "@/components/ui";
import { RegistrationFormState, DataLookup, BoardMember } from "./types";

interface BoardMembersSectionProps {
  form: RegistrationFormState;
  errors: Record<string, string>;
  boardTitleOptions: DataLookup[];
  boardName: string;
  setBoardName: React.Dispatch<React.SetStateAction<string>>;
  boardNameEn: string;
  setBoardNameEn: React.Dispatch<React.SetStateAction<string>>;
  boardPhone: string;
  setBoardPhone: (val: string) => void;
  boardTitleId: string;
  setBoardTitleId: React.Dispatch<React.SetStateAction<string>>;
  boardErrors: Record<string, string>;
  editingBoardId: string | null;
  handleAddBoardMember: () => void;
  handleEditBoardMember: (bm: BoardMember) => void;
  handleDeleteBoardMember: (id: string) => void;
}

export function BoardMembersSection({
  form,
  errors,
  boardTitleOptions,
  boardName,
  setBoardName,
  boardNameEn,
  setBoardNameEn,
  boardPhone,
  setBoardPhone,
  boardTitleId,
  setBoardTitleId,
  boardErrors,
  editingBoardId,
  handleAddBoardMember,
  handleEditBoardMember,
  handleDeleteBoardMember,
}: BoardMembersSectionProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
          የቦርድ አባላት (Board Members)
        </h4>
        {form.boardMembers.length === 0 && (
          <span className="text-xs text-red-500 font-medium">At least 1 required</span>
        )}
      </div>

      {errors.boardMembers && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> {errors.boardMembers}
        </p>
      )}

      {form.boardMembers.length > 0 && (
        <div className="space-y-2">
          {form.boardMembers.map((bm) => (
            <div key={bm.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-3 text-sm font-medium items-center">
                <span className="text-zinc-950 dark:text-white">{bm.fullName}</span>
                {bm.titleId && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs border border-zinc-200 dark:border-zinc-600">
                    {boardTitleOptions.find((t) => t.id === bm.titleId)?.description || "Unknown Title"}
                  </span>
                )}
                <span className="text-zinc-500 text-xs">{bm.phoneNumber}</span>
              </div>
              <RowActions actions={[
                presets.edit({ onClick: () => handleEditBoardMember(bm), allowed: true }),
                presets.delete({ onClick: () => handleDeleteBoardMember(bm.id), allowed: true, confirm: "Remove this board member?" }),
              ]} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
          {editingBoardId ? "Edit Board Member" : "Add Board Member"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField id="bm-title" label="ማዕረግ (Title)" error={boardErrors.boardTitleId}>
            <Select id="bm-title" value={boardTitleId} onChange={(e) => setBoardTitleId(e.target.value)}>
              <option value="">Select Title...</option>
              {boardTitleOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.note ? `${t.description} (${t.note})` : t.description}</option>
              ))}
            </Select>
          </FormField>
          <FormField id="bm-name" label="ስም — Amharic" error={boardErrors.boardName}>
            <Input id="bm-name" value={boardName} onChange={(e) => setBoardName(e.target.value)} placeholder="ሙሉ ስም" />
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <FormField id="bm-name-en" label="Name — English">
            <Input id="bm-name-en" value={boardNameEn} onChange={(e) => setBoardNameEn(e.target.value)} placeholder="Full name in English" />
          </FormField>
          <FormField id="bm-phone" label="ስልክ (Phone)" error={boardErrors.boardPhone}>
            <PhoneInput id="bm-phone" value={boardPhone} onChange={setBoardPhone} />
          </FormField>
          <Button type="button" variant="outline" onClick={handleAddBoardMember} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            {editingBoardId ? "Update Member" : "Add Member"}
          </Button>
        </div>
      </div>
    </div>
  );
}
