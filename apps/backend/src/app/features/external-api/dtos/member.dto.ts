export interface ExternalMemberReportingStatus {
  hasReported: boolean;
  year?: number;
  latestYear: number | null;
  totalReports: number;
  reports?: Array<{
    id: string;
    year: number;
    reportedAt: string;
    status: string;
    statusDescription: string | null;
    hasReceipt: boolean;
  }>;
}

export interface ExternalMemberDTO {
  id: string;
  certificate: {
    number: string;
    issuedDate: string;
    isValid: boolean;
  };
  name: {
    amharic: string;
    english: string | null;
  };
  classification: {
    typeId: string;
    typeName: string | null;
    categoryId: string | null;
    categoryName: string | null;
    fellowshipId: string;
    fellowshipName: string | null;
    fellowshipCertificateNo: string | null;
  };
  location: {
    isInEthiopia: boolean;
    country: string;
    region: string | null;
    city: string | null;
    subcity: string | null;
    zone: string | null;
    district: string | null;
    houseNumber: string | null;
    poBoxNumber: string | null;
  };
  contact: {
    phoneNumber: string | null;
    email: string | null;
    contactPerson: {
      fullName: string;
      phoneNumber: string | null;
      email: string | null;
    } | null;
  };
  status: {
    isActive: boolean;
    actionState: string | null;
    stateName: string | null;
  };
  leadership?: Array<{
    id: string;
    fullName: string;
    fullNameEn: string | null;
    title: string | null;
    isActive: boolean;
  }>;
  reportingStatus?: ExternalMemberReportingStatus;
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface ExternalCertificateVerificationDTO {
  certificateNumber: string;
  isAuthentic: boolean;
  status: "ACTIVE" | "INACTIVE" | "REVOKED" | "NOT_FOUND";
  churchNameAmharic?: string;
  churchNameEnglish?: string | null;
  issuedDate?: string;
  fellowshipName?: string | null;
  typeName?: string | null;
  verifiedAt: string;
}

export interface DTOOptions {
  includeLeadership?: boolean;
  includeReports?: boolean;
  includeContact?: boolean;
  reportYearFilter?: number;
}

export function toExternalMemberDTO(
  member: any,
  options?: DTOOptions
): ExternalMemberDTO {
  const allowContact = options?.includeContact !== false;

  const dto: ExternalMemberDTO = {
    id: member.id,
    certificate: {
      number: member.certificateNo,
      issuedDate: member.certificateIssuedDate instanceof Date 
        ? member.certificateIssuedDate.toISOString() 
        : new Date(member.certificateIssuedDate).toISOString(),
      isValid: Boolean(member.isActive && member.state?.value !== "DELETED"),
    },
    name: {
      amharic: member.name,
      english: member.nameEn || null,
    },
    classification: {
      typeId: member.typeId,
      typeName: member.type?.description || member.type?.value || null,
      categoryId: member.memberCategoryId || null,
      categoryName: member.memberCategory?.description || member.memberCategory?.value || null,
      fellowshipId: member.councilFellowshipId,
      fellowshipName: member.councilFellowship?.name || null,
      fellowshipCertificateNo: member.councilFellowship?.certificateNo || null,
    },
    location: {
      isInEthiopia: Boolean(member.isInEthiopia),
      country: member.country || "Ethiopia",
      region: member.region?.description || member.region?.value || null,
      city: member.city || null,
      subcity: member.subcity || null,
      zone: member.zone || null,
      district: member.district || null,
      houseNumber: member.houseNumber || null,
      poBoxNumber: member.poBoxNumber || null,
    },
    contact: {
      phoneNumber: allowContact ? member.phoneNumber || null : null,
      email: allowContact ? member.email || null : null,
      contactPerson: member.contactPerson
        ? {
            fullName: member.contactPerson.fullName,
            phoneNumber: allowContact ? member.contactPerson.phoneNumber || null : null,
            email: allowContact ? member.contactPerson.email || null : null,
          }
        : null,
    },
    status: {
      isActive: Boolean(member.isActive),
      actionState: member.currentActionState || null,
      stateName: member.state?.description || member.state?.value || null,
    },
    timestamps: {
      createdAt: member.createdAt instanceof Date 
        ? member.createdAt.toISOString() 
        : new Date(member.createdAt).toISOString(),
      updatedAt: member.updatedAt instanceof Date 
        ? member.updatedAt.toISOString() 
        : new Date(member.updatedAt).toISOString(),
    },
  };

  // Include Leadership / Board Members when requested & permitted
  if (options?.includeLeadership && Array.isArray(member.boardMembers)) {
    dto.leadership = member.boardMembers.map((bm: any) => ({
      id: bm.id,
      fullName: bm.fullName,
      fullNameEn: bm.fullNameEn || null,
      title: bm.title?.description || bm.title?.value || null,
      isActive: Boolean(bm.isActive),
    }));
  }

  // Include Reporting Status when requested & permitted
  if (options?.includeReports && Array.isArray(member.reports)) {
    const reportsList = member.reports;
    const filterYear = options?.reportYearFilter;

    let hasReportedForYear = false;
    if (filterYear) {
      hasReportedForYear = reportsList.some((r: any) => r.year === filterYear);
    } else {
      // Check if reported for current calendar year
      const currentYear = new Date().getFullYear();
      hasReportedForYear = reportsList.some((r: any) => r.year === currentYear);
    }

    const latestYear = reportsList.length > 0
      ? Math.max(...reportsList.map((r: any) => r.year))
      : null;

    dto.reportingStatus = {
      hasReported: hasReportedForYear,
      year: filterYear,
      latestYear,
      totalReports: reportsList.length,
      reports: reportsList.map((r: any) => ({
        id: r.id,
        year: r.year,
        reportedAt: r.reportedAt instanceof Date ? r.reportedAt.toISOString() : new Date(r.reportedAt).toISOString(),
        status: r.status?.value || "SUBMITTED",
        statusDescription: r.status?.description || null,
        hasReceipt: Boolean(r.crv || r.bankReference),
      })),
    };
  }

  return dto;
}
