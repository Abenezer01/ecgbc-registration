export const ACTION_STATE_MACHINES: Record<string, string[]> = {
  MEMBER:     ["REGISTERED", "CHECKED", "APPROVED"],
  FELLOWSHIP: ["REGISTERED", "CHECKED", "APPROVED"],
  PAYMENT:    ["PENDING", "VERIFIED", "CLEARED"],
  INVOICE:    ["ISSUED", "PAID", "RECONCILED"],
};

export const ACTION_STATE_LABELS: Record<string, string> = {
  REGISTERED: "Registered",
  CHECKED:    "Checked",
  APPROVED:   "Approved",
  PENDING:    "Pending",
  VERIFIED:   "Verified",
  CLEARED:    "Cleared",
  ISSUED:     "Issued",
  PAID:       "Paid",
  RECONCILED: "Reconciled",
};

export function getValidStates(entityType: string): string[] {
  return ACTION_STATE_MACHINES[entityType] ?? [];
}

export function isValidState(entityType: string, toState: string): boolean {
  return getValidStates(entityType).includes(toState);
}
