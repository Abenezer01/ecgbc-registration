export const ACTION_STATE_MACHINES: Record<string, string[]> = {
  MEMBER:     ["REGISTERED", "CHECKED", "APPROVED"],
  FELLOWSHIP: ["REGISTERED", "CHECKED", "APPROVED"],
  PAYMENT:    ["DRAFT", "ISSUED", "PROCESSING", "PAID", "RECONCILED"],
  INVOICE:    ["ISSUED", "PAID", "RECONCILED"],
};

export const ACTION_STATE_LABELS: Record<string, string> = {
  REGISTERED: "Registered",
  CHECKED:    "Checked",
  APPROVED:   "Approved",
  DRAFT:      "Draft",
  ISSUED:     "Issued",
  PROCESSING: "Processing",
  PAID:       "Paid",
  RECONCILED: "Reconciled",
};

export function getValidStates(entityType: string): string[] {
  return ACTION_STATE_MACHINES[entityType] ?? [];
}

export function isValidState(entityType: string, toState: string): boolean {
  return getValidStates(entityType).includes(toState);
}
