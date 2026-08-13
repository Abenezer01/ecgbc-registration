import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { extractData, extractPaginatedData } from "../lib/response-parser";

export interface DocumentType {
  id: string;
  index: number;
  type: string;
  category: string;
  description: string;
  value: string;
  note: string;
  isDefault: boolean;
  isRequired?: boolean;
  documentRequirement?: {
    id: string;
    fileTypeId: string;
    appliesTo: string;
    isRequired: boolean;
    note?: string | null;
  } | null;
}

export interface DocumentCompletenessResult {
  isComplete: boolean;
  totalRequired: number;
  uploadedCount: number;
  missingDocuments: DocumentType[];
  uploadedDocuments: Array<{
    id: string;
    fileName: string;
    fileType: {
      id: string;
      description: string;
      value: string;
    } | null;
    createdAt: Date;
  }>;
}

/**
 * Hook to check document completeness for a member
 */
export function useDocumentCompleteness(memberId: string) {
  return useQuery({
    queryKey: ["document-completeness", memberId],
    queryFn: async () => {
      // Fetch required document types
      const typesRes = await api.get("/data-lookups?category=FILE_TYPE&type=Document Type");
      const typesData = extractPaginatedData(typesRes).data;
      const documentTypes = ((typesData as any).dataLookups || (typesData as any).lookups || []) as DocumentType[];
      const requiredTypes = documentTypes.filter(dt => !!(dt.documentRequirement?.isRequired ?? dt.isRequired));

      // Fetch uploaded files for member
      const filesRes = await api.get("/files", { params: { memberId, _limit: 100 } });
      const filesData = extractPaginatedData(filesRes).data;
      const files = ((filesData as any).files || []) as any[];

      // Calculate completeness
      const missingDocuments = requiredTypes.filter(dt => 
        !files.some(f => 
          f.category?.id === dt.id || 
          f.category?.value === dt.value || 
          f.fileType?.id === dt.id
        )
      );

      return {
        isComplete: missingDocuments.length === 0,
        totalRequired: requiredTypes.length,
        uploadedCount: requiredTypes.length - missingDocuments.length,
        missingDocuments,
        uploadedDocuments: files,
      } as DocumentCompletenessResult;
    },
    enabled: !!memberId,
  });
}

/**
 * Hook to get all required document types (FILE_TYPE category)
 */
export function useRequiredDocumentTypes() {
  return useQuery({
    queryKey: ["document-types"],
    queryFn: async () => {
      const res = await api.get("/data-lookups?category=FILE_TYPE&type=Document Type");
      const { data } = extractPaginatedData(res);
      return ((data as any).dataLookups || (data as any).lookups || (data as any).dataLookups || []) as DocumentType[];
    },
  });
}

/**
 * Hook to get all report types (REPORT_TYPE category)
 */
export function useReportTypes() {
  return useQuery({
    queryKey: ["report-types"],
    queryFn: async () => {
      const res = await api.get("/data-lookups?category=REPORT_TYPE");
      const { data } = extractPaginatedData(res);
      return ((data as any).dataLookups || (data as any).lookups || []) as DocumentType[];
    },
  });
}
