"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  Download,
  ShieldAlert,
  Building2,
  ChevronDown,
  ArrowRightLeft,
  GitMerge,
  GitFork,
  AlertTriangle,
} from "lucide-react";
import { useMembers, MembersFilters } from "@/hooks/useMembers";
import { useMemberStats } from "@/hooks/useMemberStats";
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

import { getColumns } from "./components/Columns";
import { MembersFilterRibbon } from "./components/MembersFilterRibbon";
import { MembersStatCards } from "./components/MembersStatCards";
import { AddMemberModal } from "./components/AddMemberModal";
import { TransferChurchModal } from "./components/TransferChurchModal";
import { MergeChurchModal } from "./components/MergeChurchModal";
import { SplitChurchModal } from "./components/SplitChurchModal";
import { VoluntaryClosureModal } from "./components/VoluntaryClosureModal";
import type { MemberOption } from "./components/ChurchSearchPicker";
import { formatEthiopianDate, getCurrentEthYear } from "@/lib/dateUtils";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: MembersFilters = {
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
};

export default function MembersPage() {
  const router = useRouter();
  const { staff, rbac, hasPermission } = useAuth();
  const canDeleteMember = hasPermission("delete_member");
  const canExport = hasPermission("view_member");
  const staffIsOwner = staff?.role?.type?.value === "role_type_owner";
  const canEditMember = hasPermission("change_member") || staffIsOwner;
  const canDeactivate = hasPermission("deactivate_member") || canDeleteMember || staffIsOwner;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Church Operations State (Standalone & Contextual)
  const [opsMenuOpen, setOpsMenuOpen] = useState(false);
  const opsMenuRef = useRef<HTMLDivElement>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<any | null>(null);
  const [mergeInitialChurches, setMergeInitialChurches] = useState<MemberOption[]>([]);

  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitTarget, setSplitTarget] = useState<any | null>(null);

  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureTarget, setClosureTarget] = useState<any | null>(null);

  // Close church operations dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opsMenuRef.current && !opsMenuRef.current.contains(event.target as Node)) {
        setOpsMenuOpen(false);
      }
    };
    if (opsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [opsMenuOpen]);

  const deleteMemberMutation = useDeleteMember();

  const [filters, setFilters] = useState<MembersFilters>(DEFAULT_FILTERS);

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const { data: lookups } = useDataLookups();
  const { data: fellowshipsData } = useFellowships({ limit: 100 });

  const memberTypeOptions = lookups?.filter((l) => l.type === "member_type") || [];
  const regionOptions = lookups?.filter((l) => l.type === "region") || [];
  const statusOptions = lookups?.filter((l) => l.type === "object_state" && l.value !== "DELETED") || [];
  const reportStatusOptions = lookups?.filter((l) => l.type === "report_state") || [];

  const { data: stats, isLoading: statsLoading } = useMemberStats(filters, memberTypeOptions);

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

  // Memoized columns with row actions attached
  const tableColumns = useMemo(() => {
    return getColumns({
      onView: (row) => router.push(`/members/${row.id}`),
      onTransfer: (row) => {
        setTransferTarget(row);
        setTransferModalOpen(true);
      },
      onMerge: (row) => {
        setMergeTarget(row);
        setMergeInitialChurches([]);
        setMergeModalOpen(true);
      },
      onSplit: (row) => {
        setSplitTarget(row);
        setSplitModalOpen(true);
      },
      onClosure: (row) => {
        setClosureTarget(row);
        setClosureModalOpen(true);
      },
    });
  }, [router]);

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
            <Button
              variant="outline"
              onClick={() => router.push("/members/duplicates")}
              className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <ShieldAlert className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
              Duplicate Audit
            </Button>
            {canExport && (
              <Button variant="outline" onClick={handleExportAll} disabled={downloading}>
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Exporting..." : "Export"}
              </Button>
            )}
            {canEditMember && (
              <div className="relative" ref={opsMenuRef}>
                <Button
                  variant="outline"
                  onClick={() => setOpsMenuOpen((prev) => !prev)}
                  className="gap-1.5 text-zinc-700 dark:text-zinc-200"
                >
                  <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Church Operations</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      opsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {opsMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Church Lifecycle
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpsMenuOpen(false);
                        setTransferTarget(null);
                        setTransferModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Transfer Fellowship</div>
                        <div className="text-xs text-zinc-400">Relocate to another fellowship</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpsMenuOpen(false);
                        setMergeTarget(null);
                        setMergeInitialChurches([]);
                        setMergeModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                        <GitMerge className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Merge Churches</div>
                        <div className="text-xs text-zinc-400">Combine into one surviving church</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpsMenuOpen(false);
                        setSplitTarget(null);
                        setSplitModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <GitFork className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Split Church</div>
                        <div className="text-xs text-zinc-400">Branch daughter assemblies</div>
                      </div>
                    </button>

                    {canDeactivate && (
                      <>
                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setOpsMenuOpen(false);
                            setClosureTarget(null);
                            setClosureModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors text-left"
                        >
                          <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">Voluntary Closure</div>
                            <div className="text-xs text-amber-500/80">Deactivate / record closure</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            <span>{selectedIds.length} selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEditMember && selectedIds.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedMembers = members.filter((m: any) => selectedIds.includes(m.id));
                  const memberOptions = selectedMembers.map((m: any) => ({
                    id: m.id,
                    name: m.name || m.fullName || "Unknown",
                    certificateNo: m.certificateNo || "",
                    isActive: m.isActive,
                  }));
                  setMergeInitialChurches(memberOptions);
                  setMergeTarget(null);
                  setMergeModalOpen(true);
                }}
                className="text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                <GitMerge className="mr-1.5 h-4 w-4 text-purple-600 dark:text-purple-400" />
                Merge Selected ({selectedIds.length})
              </Button>
            )}

            {canEditMember && selectedIds.length === 1 && (() => {
              const singleSelected = members.find((m: any) => m.id === selectedIds[0]);
              if (!singleSelected) return null;
              return (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTransferTarget(singleSelected);
                      setTransferModalOpen(true);
                    }}
                  >
                    <ArrowRightLeft className="mr-1.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Transfer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMergeTarget(singleSelected);
                      setMergeInitialChurches([]);
                      setMergeModalOpen(true);
                    }}
                  >
                    <GitMerge className="mr-1.5 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Merge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSplitTarget(singleSelected);
                      setSplitModalOpen(true);
                    }}
                  >
                    <GitFork className="mr-1.5 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Split
                  </Button>
                  {canDeactivate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setClosureTarget(singleSelected);
                        setClosureModalOpen(true);
                      }}
                      className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    >
                      <AlertTriangle className="mr-1.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Close
                    </Button>
                  )}
                </>
              );
            })()}

            {canExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                disabled={downloading}
              >
                Export Selected
              </Button>
            )}
            {canDeleteMember && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      <MembersStatCards
        filters={filters}
        stats={stats}
        isLoading={statsLoading}
        onFilterChange={(next) => setFilters({ ...next, page: 1 })}
      />

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
        onReset={handleResetFilters}
      />

      <DataTable<any>
        columns={tableColumns}
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

      {transferModalOpen && (
        <TransferChurchModal
          isOpen={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setTransferTarget(null);
          }}
          member={transferTarget}
          onSuccess={() => {
            refetch();
            setSelectedIds([]);
          }}
        />
      )}

      {mergeModalOpen && (
        <MergeChurchModal
          isOpen={mergeModalOpen}
          onClose={() => {
            setMergeModalOpen(false);
            setMergeTarget(null);
            setMergeInitialChurches([]);
          }}
          targetMember={mergeTarget}
          initialSelectedChurches={mergeInitialChurches}
          onSuccess={() => {
            refetch();
            setSelectedIds([]);
          }}
        />
      )}

      {splitModalOpen && (
        <SplitChurchModal
          isOpen={splitModalOpen}
          onClose={() => {
            setSplitModalOpen(false);
            setSplitTarget(null);
          }}
          parentMember={splitTarget}
          onSuccess={() => {
            refetch();
            setSelectedIds([]);
          }}
        />
      )}

      {closureModalOpen && (
        <VoluntaryClosureModal
          isOpen={closureModalOpen}
          onClose={() => {
            setClosureModalOpen(false);
            setClosureTarget(null);
          }}
          member={closureTarget}
          onSuccess={() => {
            refetch();
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}