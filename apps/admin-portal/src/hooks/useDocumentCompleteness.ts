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
      // TODO: Implement backend endpoint for document completeness
      // For now, return a default response to prevent 404 errors
      return {
        isComplete: false,
        totalRequired: 0,
        uploadedCount: 0,
        missingDocuments: [],
        uploadedDocuments: [],
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
