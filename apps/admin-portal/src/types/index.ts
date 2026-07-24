// ─── Member ───────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface Fellowship {
  id: string;
  name: string;
  region?: Region;
}

export interface BoardMember {
  id: string;
  fullName: string;
  phoneNumber?: string;
}

export interface Report {
  id: string;
  year: number;
  crv?: string;
  remark?: string;
  reportedAt: string;
  bankReference?: string;
  status?: {
    value: string;
    description: string;
  };
  file?: string;
}

export interface Permission {
  id?: string;
  codeName?: string;
  name?: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  staff: Staff;
  rbac: RBACScope | null;
}

export interface RBACScope {
  allowedFellowshipIds?: string[];
  permissions?: string[];
  role?: {
    id?: string;
    name?: string;
    type?: {
      value?: string;
      description?: string;
    };
  };
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  role?: {
    id?: string;
    name?: string;
    roleId?: string;
    permissions?: Permission[];
    type?: {
      value?: string;
      description?: string;
    };
  };
  roleId?: string;
  state?: {
    value?: string;
    description?: string;
  };
  fellowships?: Array<{
    id?: string;
    name?: string;
    fellowship?: {
      id?: string;
      name?: string;
    };
  }>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  category?: Category;
  fellowship?: Fellowship;
  boardMembers?: BoardMember[];
  certificateNo?: string;
  certificateIssuedDate?: string;
  isInEthiopia?: boolean;
  country?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  reports?: Report[];
  fullName?: string;
}