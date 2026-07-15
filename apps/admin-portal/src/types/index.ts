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

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}