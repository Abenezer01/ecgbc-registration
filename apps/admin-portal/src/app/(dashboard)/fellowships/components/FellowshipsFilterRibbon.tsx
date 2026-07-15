import React from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui";
import { FellowshipsFilters } from "@/hooks/useFellowships";

interface FellowshipsFilterRibbonProps {
  filters: FellowshipsFilters;
  updateFilter: (key: keyof FellowshipsFilters, value: any) => void;
  handleSearch: (val: string) => void;
  regionOptions: any[];
}

export function FellowshipsFilterRibbon({
  filters,
  updateFilter,
  handleSearch,
  regionOptions,
}: FellowshipsFilterRibbonProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-4 relative z-10">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Search fellowships..."
              className="pl-9 bg-zinc-50 dark:bg-zinc-950"
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-[180px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Region</label>
          <Select 
            value={filters.regionId || "all"} 
            onChange={(e) => updateFilter("regionId", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            <option value="all">All Regions</option>
            {regionOptions.map((r) => <option key={r.id} value={r.id}>{r.description || r.name}</option>)}
          </Select>
        </div>

        <div className="w-[140px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Status</label>
          <Select 
            value={filters.isActive || "all"} 
            onChange={(e) => updateFilter("isActive", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
