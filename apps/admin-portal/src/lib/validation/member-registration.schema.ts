import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────
export const MAX_FILES = 5;
export const MAX_TOTAL_SIZE_MB = 100;
export const MAX_PER_FILE_SIZE_MB = 20;
export const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
export const MAX_PER_FILE_SIZE_BYTES = MAX_PER_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

// ─── Phone regex ─────────────────────────────────────────────────────────────
// Allows: +251911234567, 0911234567, +447911123456 etc.
const phoneRegex = /^(\+?\d[\d\s\-]{6,16}\d)$/;

// ─── Email regex ─────────────────────────────────────────────────────────────
const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ─── Board Member Sub-schema ──────────────────────────────────────────────────
export const boardMemberSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  fullNameEn: z.string().optional(),
  phoneNumber: z
    .string()
    .min(1, "Phone is required")
    .regex(phoneRegex, "Invalid phone number format"),
  titleId: z.string().min(1, "Title is required"),
});

// ─── Main Registration Schema ─────────────────────────────────────────────────
export const memberRegistrationSchema = z
  .object({
    // --- Fellowship & Type ---
    councilFellowshipId: z.string().min(1, "Council Fellowship is required"),
    typeId: z.string().min(1, "Member Type is required"),
    stateId: z.string().min(1, "State is required"),
    isInEthiopia: z.boolean(),

    // --- Organization Details ---
    name: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(200, "Organization name is too long"),
    nameEn: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^[a-zA-Z0-9\s\-'.&]+$/.test(v),
        "English name must only contain Latin characters"
      ),
    certificateNo: z
      .string()
      .min(3, "Certificate number must be at least 3 digits")
      .max(12, "Certificate number must be at most 12 digits")
      .regex(/^\d+$/, "Certificate number must contain digits only"),
    certificateIssuedDate: z
      .string()
      .min(1, "Certificate issued date is required")
      .refine((v) => {
        if (!v) return false;
        const d = new Date(v);
        return !isNaN(d.getTime()) && d <= new Date();
      }, "Certificate date cannot be in the future"),

    // --- Board Members ---
    boardMembers: z
      .array(boardMemberSchema)
      .min(1, "At least one board member is required"),

    // --- Location ---
    regionId: z.string().optional(),
    country: z.string().optional(),
    city: z.string().min(2, "City must be at least 2 characters"),
    subcity: z.string().optional(),
    zone: z.string().optional(),
    district: z.string().optional(),
    houseNumber: z.string().optional(),
    poBoxNumber: z.string().optional(),

    // --- Contact ---
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (v) => !v || phoneRegex.test(v),
        "Invalid phone number format"
      ),
    email: z
      .string()
      .optional()
      .refine(
        (v) => !v || emailRegex.test(v),
        "Invalid email address format"
      ),

    // --- Contact Person ---
    contactPersonFullName: z.string().optional(),
    contactPersonPhoneNumber: z
      .string()
      .optional()
      .refine(
        (v) => !v || phoneRegex.test(v),
        "Invalid contact person phone number"
      ),
    contactPersonEmail: z
      .string()
      .optional()
      .refine(
        (v) => !v || emailRegex.test(v),
        "Invalid contact person email"
      ),

    isActive: z.boolean(),
  })
  // --- Cross-field rules ---
  .superRefine((data, ctx) => {
    // Region required if Ethiopia
    if (data.isInEthiopia && !data.regionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Region is required for Ethiopian organizations",
        path: ["regionId"],
      });
    }
    // Country required if abroad
    if (!data.isInEthiopia && !data.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required for organizations outside Ethiopia",
        path: ["country"],
      });
    }
    // If contact person name is filled, phone is required
    if (
      data.contactPersonFullName?.trim() &&
      !data.contactPersonPhoneNumber?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone is required when contact person name is provided",
        path: ["contactPersonPhoneNumber"],
      });
    }
  });

export type MemberRegistrationForm = z.infer<typeof memberRegistrationSchema>;

// ─── File Validators ──────────────────────────────────────────────────────────
export function validateFiles(
  files: File[],
  fileCategories: Record<number, string>,
  requiredCategoryIds: string[]
): { errors: string[]; perFileErrors: Record<number, string> } {
  const errors: string[] = [];
  const perFileErrors: Record<number, string> = {};

  if (files.length > MAX_FILES) {
    errors.push(`Maximum of ${MAX_FILES} files allowed. You have ${files.length}.`);
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    errors.push(
      `Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`
    );
  }

  files.forEach((file, idx) => {
    if (file.size > MAX_PER_FILE_SIZE_BYTES) {
      perFileErrors[idx] = `File "${file.name}" exceeds the ${MAX_PER_FILE_SIZE_MB}MB per-file limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
    }
  });

  // Check that each file has a category selected
  files.forEach((file, idx) => {
    if (!fileCategories[idx]) {
      perFileErrors[idx] = perFileErrors[idx] || `Please select a document category for "${file.name}".`;
    }
  });

  // Warn about missing required document categories (non-blocking)
  const uploadedCategoryIds = Object.values(fileCategories);
  const missingRequired = requiredCategoryIds.filter(
    (id) => !uploadedCategoryIds.includes(id)
  );
  if (missingRequired.length > 0) {
    errors.push(
      `${missingRequired.length} required document(s) not yet uploaded. Please check the required documents list.`
    );
  }

  return { errors, perFileErrors };
}

// ─── Flat error extractor (path[] → Record<string, string>) ──────────────────
export function zodErrorsToRecord(
  error: z.ZodError
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
