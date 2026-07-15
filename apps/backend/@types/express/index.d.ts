import { Staff, Role, Permission, DataLookup } from "@prisma/client";
import { IFilter } from "../../src/app/shared/interfaces/filter.interface";

// Define an augmented staff type including loaded relations we attach in auth middleware
export interface AuthenticatedStaff extends Staff {
  role: Role & {
    permissions: Permission[];
    type?: DataLookup | null;
  };
}

declare global {
  namespace Express {
    interface Request {
      // Existing augmentation for staff authentication
      staff?: AuthenticatedStaff;
      isAdminRole?: boolean;
      filters?: IFilter;
      // RBAC scope info
      rbac?: {
        allowedFellowshipIds?: string[];
        allowedCategoryIds?: string[]; // ministry categories allowed for current staff
      };
      // Preserve previous user augmentation (used elsewhere for legacy code)
      user?: {
        email: string;
      };
    }
  }
}

export {};
