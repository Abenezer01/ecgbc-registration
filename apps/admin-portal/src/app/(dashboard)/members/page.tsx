"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, RefreshCw, Download } from "lucide-react";
import { useMembers, MembersFilters } from "@/hooks/useMembers";
import { useFellowships } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";
import { useAuth } from "@/hooks/useAuth";
import type { Member } from "@/types";
import { useDeleteMember } from "@/hooks/useDeleteMember";
import {
  PageHeader,
  Button,
  DataTable,
  Pagination,
} from "@/components/ui";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { columns } from "./components/Columns";
import { MembersFilterRibbon } from "./components/MembersFilterRibbon";
import { AddMemberModal } from "./components/AddMemberModal";
import { formatEthiopianDate, getCurrentEthYear } from "@/lib/dateUtils";

const PAGE_SIZE = 20;

export default function MembersPage() {
  const router = useRouter();
  const { staff, rbac, hasPermission } = useAuth();
  const staffIsOwner = staff?.role?.type?.value === "role_type_owner";

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const deleteMemberMutation = useDeleteMember();

  const [filters, setFilters] = useState<MembersFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
    search: "",
    fellowshipId: "all",
    typeId: "all",
    stateId: "all",
    regionId: "all",
    isInEthiopia: "all",
    memberTypeChanged: "all",
    filterByReport: false,
    reportStatus: "all",
    reportYear: new Date().getFullYear() - 8,
  });

  const { data: lookups } = useDataLookups();
  const { data: fellowshipsData } = useFellowships({ limit: 100 });

  const memberTypeOptions = lookups?.filter((l) => l.type === "member_type") || [];
  const regionOptions = lookups?.filter((l) => l.type === "region") || [];
  const statusOptions = lookups?.filter((l) => l.type === "object_state" && l.value !== "DELETED") || [];
  const reportStatusOptions = lookups?.filter((l) => l.type === "report_state") || [];

  const fellowShipOptions = useMemo(() => {
    if (!fellowshipsData?.fellowships) return [];
    if (staffIsOwner) return fellowshipsData.fellowships;
    const allowed = rbac?.allowedFellowshipIds || [];
    return fellowshipsData.fellowships.filter((f) => allowed.includes(f.id));
  }, [staffIsOwner, fellowshipsData, rbac]);

  // Sync debounce search to filters
  const handleSearch = (val: string) => {
    setFilters((prev) => ({ ...prev, search: val, page: 1 }));
    clearTimeout((window as any).memberSearchTimer);
    (window as any).memberSearchTimer = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data, isLoading, refetch, isFetching } = useMembers({
    ...filters,
    search: debouncedSearch || undefined,
  });

  const members = data?.members ?? [];
  const total = data?.total ?? 0;

  // Only show member rows — fellowships have their own dedicated page
  const displayRows = useMemo(() => {
    return members.map((m: Member) => ({ ...m, kind: "member" }));
  }, [members]);

  const handleExportAll = async () => {
    try {
      setDownloading(true);
      const queryParams: Record<string, any> = { _page: 1, _limit: 100000 };
      if (filters.stateId && filters.stateId !== "all") queryParams.stateId = filters.stateId;
      if (filters.regionId && filters.regionId !== "all") queryParams.regionId = filters.regionId;
      if (filters.typeId && filters.typeId !== "all") queryParams.typeId = filters.typeId;
      if (filters.isInEthiopia && filters.isInEthiopia !== "all") queryParams.isInEthiopia = filters.isInEthiopia;
      if (filters.search) queryParams._search = filters.search;
      if (filters.fellowshipId && filters.fellowshipId !== "all") queryParams.councilFellowshipId = filters.fellowshipId;
      if (filters.filterByReport) {
        if (filters.reportStatus && filters.reportStatus !== "all") queryParams.reportStatus = filters.reportStatus;
        queryParams.reportYear = filters.reportYear;
      }
      if (filters.memberTypeChanged && filters.memberTypeChanged !== "all") {
        queryParams.memberTypeChanged = filters.memberTypeChanged;
      }

      const response = await api.get(`/members`, { params: queryParams });
      const apiData = response.data.data.members as any[];

      if (!apiData || apiData.length === 0) {
        alert("No data found to export");
        return;
      }

      const startYear = 2013;
      const endYear = getCurrentEthYear();
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

      const dataRows = [
        [
          "Name", "Certificate No", "Certificate Issued Date", "Country", "City",
          "Contact Phone Number", "Contact Email", "Board Member Name", "Board Member Phone",
          ...years.map((y) => `${y} Report Status`),
          ...years.map((y) => `${y} Bank Ref`),
          ...years.map((y) => `${y} Remark`),
        ],
        ...apiData.flatMap((member) => {
          const reports = member.reports || [];
          const rStatus = years.map((y) => reports.find((r: any) => r.year === y)?.status?.description || "Not Reported");
          const rBankRef = years.map((y) => reports.find((r: any) => r.year === y)?.bankReference || "");
          const rRemark = years.map((y) => reports.find((r: any) => r.year === y)?.remark || "");

          const boardMembers = member.boardMembers || [];
          const mainRow = [
            member.fullName,
            member.certificateNo,
            member.certificateIssuedDate ? formatEthiopianDate(member.certificateIssuedDate) : "",
            member.isInEthiopia ? "Ethiopia" : member.country,
            member.city,
            member.phoneNumber,
            member.email,
            boardMembers[0]?.fullName || "",
            boardMembers[0]?.phoneNumber || "",
            ...rStatus, ...rBankRef, ...rRemark,
          ];
          const bRows = boardMembers.slice(1).map((bm: any) => [
            "", "", "", "", "", "", "", bm.fullName, bm.phoneNumber,
            ...Array(years.length).fill(""), ...Array(years.length).fill(""), ...Array(years.length).fill("")
          ]);
          return [mainRow, ...bRows];
        }),
      ];

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Members Report");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "Members_Report.xlsx");
    } catch (error) {
      console.error("Export error", error);
      alert("An error occurred during export");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setDownloading(true);
      // Filter members currently fetched (current page) by selected ids
      const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
      if (selectedMembers.length === 0) {
        alert("No selected members found on current page");
        return;
      }
      // Build export similar to full export but only for selectedMembers
      const startYear = 2013;
      const endYear = getCurrentEthYear();
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

      const dataRows = [
        [
          "Name", "Certificate No", "Certificate Issued Date", "Country", "City",
          "Contact Phone Number", "Contact Email", "Board Member Name", "Board Member Phone",
          ...years.map((y) => `${y} Report Status`),
          ...years.map((y) => `${y} Bank Ref`),
          ...years.map((y) => `${y} Remark`),
        ],
        ...selectedMembers.flatMap((member) => {
          const reports = member.reports || [];
          const rStatus = years.map((y) => reports.find((r: any) => r.year === y)?.status?.description || "Not Reported");
          const rBankRef = years.map((y) => reports.find((r: any) => r.year === y)?.bankReference || "");
          const rRemark = years.map((y) => reports.find((r: any) => r.year === y)?.remark || "");

          const boardMembers = member.boardMembers || [];
          const mainRow = [
            member.fullName,
            member.certificateNo,
            member.certificateIssuedDate ? formatEthiopianDate(member.certificateIssuedDate) : "",
            member.isInEthiopia ? "Ethiopia" : member.country,
            member.city,
            member.phoneNumber,
            member.email,
            boardMembers[0]?.fullName || "",
            boardMembers[0]?.phoneNumber || "",
            ...rStatus, ...rBankRef, ...rRemark,
          ];
          const bRows = boardMembers.slice(1).map((bm: any) => [
            "", "", "", "", "", "", "", bm.fullName, bm.phoneNumber,
            ...Array(years.length).fill(""), ...Array(years.length).fill(""), ...Array(years.length).fill("")
          ]);
          return [mainRow, ...bRows];
        }),
      ];

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Members Report");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Members_Selected_${selectedMembers.length}.xlsx`);
    } catch (error) {
      console.error("Export selected error", error);
      alert("An error occurred during export");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected member(s)?`)) return;
    try {
      // Execute deletions in parallel
      await Promise.all(
        selectedIds.map((id) => deleteMemberMutation.mutateAsync(id))
      );
      // Refresh list to reflect deletions
      await refetch();
      // Clear selection
      setSelectedIds([]);
    } catch (err) {
      // Error handling handled by mutation's onError toast
      console.error("Delete selected failed", err);
    }
  };

  const updateFilter = (key: keyof MembersFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members List"
        description={`${total.toLocaleString()} total registered members`}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleExportAll} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Exporting..." : "Export"}
            </Button>
            {hasPermission("add_member") && (
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </>
        }
      />

      {/* Selection feedback and bulk actions */}
      {selectedIds.length > 0 && (
        <>
          <div className="flex items-center justify-between space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedIds.length} selected
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                disabled={downloading}
              >
                Export Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </>
      )}

      <MembersFilterRibbon
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        fellowShipOptions={fellowShipOptions}
        memberTypeOptions={memberTypeOptions}
        statusOptions={statusOptions}
        regionOptions={regionOptions}
        reportStatusOptions={reportStatusOptions}
        staffIsOwner={staffIsOwner}
      />

      <DataTable<any>
        columns={columns}
        data={displayRows}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          if (row.kind === "fellowship") {
            router.push(`/fellowships/${row.id}`);
          } else {
            router.push(`/members/${row.id}`);
          }
        }}
        // Selection props
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids as string[])}
        emptyTitle="No members found"
        emptyDescription="Try adjusting your search criteria."
      />

      {total > PAGE_SIZE && (
        <Pagination
          page={filters.page || 1}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={handlePageChange}
        />
      )}

      {addOpen && (
        <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
      )}
    </div>
  );
}