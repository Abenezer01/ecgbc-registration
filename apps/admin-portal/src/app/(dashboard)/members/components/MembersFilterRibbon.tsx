import React from "react";
import { Search } from "lucide-react";
import { Input, Select, Button } from "@/components/ui";
import { MembersFilters } from "@/hooks/useMembers";

interface MembersFilterRibbonProps {
  filters: MembersFilters;
  updateFilter: (key: keyof MembersFilters, value: any) => void;
  handleSearch: (val: string) => void;
  fellowShipOptions: any[];
  memberTypeOptions: any[];
  statusOptions: any[];
  regionOptions: any[];
  reportStatusOptions: any[];
  staffIsOwner: boolean;
}

export function MembersFilterRibbon({
  filters,
  updateFilter,
  handleSearch,
  fellowShipOptions,
  memberTypeOptions,
  statusOptions,
  regionOptions,
  reportStatusOptions,
  staffIsOwner,
}: MembersFilterRibbonProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-4 relative z-10">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Search name, city, certificate..."
              className="pl-9 bg-zinc-50 dark:bg-zinc-950"
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-[200px] relative">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Council Fellowship</label>
          <Select 
            value={filters.fellowshipId || "all"} 
            onChange={(e) => updateFilter("fellowshipId", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            {(staffIsOwner || fellowShipOptions.length > 1) && (
              <option value="all">{staffIsOwner ? "All" : "All assigned fellowships"}</option>
            )}
            {fellowShipOptions.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </div>

        <div className="w-[160px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Institution Type</label>
          <Select 
            value={filters.typeId || "all"} 
            onChange={(e) => updateFilter("typeId", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            <option value="all">All</option>
            {memberTypeOptions.map((t) => <option key={t.id} value={t.id}>{t.description}</option>)}
          </Select>
        </div>

        <div className="w-[140px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Status</label>
          <Select 
            value={filters.stateId || "all"} 
            onChange={(e) => updateFilter("stateId", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            <option value="all">All</option>
            {statusOptions.map((s) => <option key={s.id} value={s.id}>{s.description}</option>)}
          </Select>
        </div>

        <div className="w-[150px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Region</label>
          <Select 
            value={filters.regionId || "all"} 
            onChange={(e) => updateFilter("regionId", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950"
          >
            <option value="all">All</option>
            {regionOptions.map((r) => <option key={r.id} value={r.id}>{r.description}</option>)}
          </Select>
        </div>
        
        <Button 
          variant={filters.filterByReport ? "primary" : "outline"}
          onClick={() => updateFilter("filterByReport", !filters.filterByReport)}
          className="h-10 shrink-0"
        >
          Report Filter
        </Button>
      </div>

      {filters.filterByReport && (
        <div className="flex flex-wrap gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-[160px]">
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Report Status</label>
            <Select 
              value={filters.reportStatus || "all"} 
              onChange={(e) => updateFilter("reportStatus", e.target.value)}
              className="w-full"
            >
              <option value="all">All</option>
              {reportStatusOptions.map((s) => <option key={s.id} value={s.id}>{s.description}</option>)}
            </Select>
          </div>
          <div className="w-[140px]">
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Report Year</label>
            <Input 
              type="number" 
              value={filters.reportYear || ""} 
              onChange={(e) => updateFilter("reportYear", Number(e.target.value))} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
