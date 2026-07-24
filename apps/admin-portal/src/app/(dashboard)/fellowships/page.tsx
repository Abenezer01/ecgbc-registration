"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  Button,
  Input,
  Badge,
  DataTable,
  Pagination,
  Card,
  CardContent,
  StatCard,
  StatCardSkeleton,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import api from "@/lib/api";
import { buildQueryString } from "@/lib/query-builder";
import { FellowshipsFilterRibbon } from "./components/FellowshipsFilterRibbon";
import { useFellowships, FellowshipsFilters } from "@/hooks/useFellowships";
import { useDataLookups } from "@/hooks/useDataLookups";

interface Fellowship {
  id: string;
  name: string;
  region?: { name: string };
  _count?: { members: number };
  isActive: boolean;
}

const PAGE_SIZE = 20;

export default function FellowshipsPage() {
  const router = useRouter();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const COLUMNS: Column<Fellowship>[] = [
    {
      key: "name",
      header: "Fellowship Name",
      cell: (row) => (
        <button 
          onClick={() => router.push(`/fellowships/${row.id}`)}
          className="font-medium text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "region",
      header: "Region",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {row.region?.name ?? <span className="text-zinc-400">—</span>}
        </div>
      ),
    },
    {
      key: "members",
      header: "Members",
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {row._count?.members ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];
  
  const [filters, setFilters] = useState<FellowshipsFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
    search: "",
    regionId: "all",
    isActive: "all",
    sortBy: "name",
    sortDirection: "asc"
  });

  const { data: lookups } = useDataLookups();
  const regionOptions = lookups?.filter((l) => l.type === "region") || [];

  const handleSearch = (val: string) => {
    setFilters((prev) => ({ ...prev, search: val, page: 1 }));
    clearTimeout((window as any).__fellowshipTimer);
    (window as any).__fellowshipTimer = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const updateFilter = (key: keyof FellowshipsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data, isLoading, refetch, isFetching } = useFellowships({
    ...filters,
    search: debouncedSearch || undefined,
  });

  const fellowships: Fellowship[] = data?.fellowships ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fellowships"
        description={`${total.toLocaleString()} fellowships registered`}
        actions={
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      <FellowshipsFilterRibbon
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        regionOptions={regionOptions}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Fellowships" value={total} icon={<MapPin className="h-5 w-5" />} />
            <StatCard
              title="Active"
              value={fellowships.filter((f) => f.isActive).length}
              icon={<MapPin className="h-5 w-5" />}
              trend={{ value: "Active", positive: true }}
            />
            <StatCard
              title="Total Members"
              value={fellowships.reduce((acc, f) => acc + (f._count?.members ?? 0), 0)}
              icon={<MapPin className="h-5 w-5" />}
              description="Across all fellowships"
            />
          </>
        )}
      </div>

      {/* Table */}
      <DataTable<Fellowship>
        columns={COLUMNS}
        data={fellowships}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        rowKey={(row) => row.id}
        emptyTitle="No fellowships found"
        emptyDescription="Try adjusting your search criteria."
      />

      {total > PAGE_SIZE && (
        <Pagination page={filters.page || 1} pageSize={PAGE_SIZE} total={total} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
