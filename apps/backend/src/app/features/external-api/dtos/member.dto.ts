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
      phoneNumber: string;
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

export function toExternalMemberDTO(
  member: any,
  options?: { includeLeadership?: boolean }
): ExternalMemberDTO {
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
      phoneNumber: member.phoneNumber || null,
      email: member.email || null,
      contactPerson: member.contactPerson
        ? {
            fullName: member.contactPerson.fullName,
            phoneNumber: member.contactPerson.phoneNumber,
            email: member.contactPerson.email || null,
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

  if (options?.includeLeadership && Array.isArray(member.boardMembers)) {
    dto.leadership = member.boardMembers.map((bm: any) => ({
      id: bm.id,
      fullName: bm.fullName,
      fullNameEn: bm.fullNameEn || null,
      title: bm.title?.description || bm.title?.value || null,
      isActive: Boolean(bm.isActive),
    }));
  }

  return dto;
}
