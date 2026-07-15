import {
  Box,
  Button,
  CircularProgress,
  // Button,
  Dialog,
  Divider,
  FormControl,
  // FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import StyledTableRow, { StyledTableCell } from "../shared/TableComponents";
import {
  objectStatusColor,
} from "../../utils/state-color.util";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useEffect, useMemo, useState } from "react";
import { fetchMembers } from "../../store/features/member.slice";
import { MembersTableLoading } from "../shared/Loaders";
import { RoleType } from "../../enums/role-type.enum";
import { Member } from "../../types/model/member.model";
import { Transition } from "../shared/ModalTransition";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import theme from "../../theme";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
// import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import debounce from "lodash.debounce";
import { fetchDataLookups } from "../../store/features/data-lookup.slice";
import { fetchFellowships } from "../../store/features/fellowship.slice";
import { MembersQuery } from "../../types/query/query-params.type";
import { CommonObjectState } from "../../enums/common-object-state.enum";
import { toast } from "sonner";
import api from "../../api/axios";
import { getCurrentEthYear } from "../../utils/date-util";
import { toEthiopianDateText } from "../../utils/ethiopian-date.util";
import { formatCertificateNumber } from "../../utils/memberUtils";
import { SxProps, Theme } from '@mui/material';

const filterInputBaseStyles: SxProps<Theme> = {
  fontSize: '0.95rem',
  '& .MuiOutlinedInput-root': {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    border: '1px solid #D0D5DD',
    transition: 'background-color .15s ease, border-color .15s ease, box-shadow .2s ease',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '&:hover': {
      backgroundColor: '#F8FAFC',
      borderColor: '#B8C2CC'
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
      borderColor: '#6366F1',
      boxShadow: '0 0 0 2px rgba(99,102,241,0.18)',
    }
  },
  '& .MuiInputBase-input': {
    padding: '0 12px',
    height: '44px',
    lineHeight: '44px',
    fontSize: '0.95rem'
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    py: 0,
    px: 1.5,
    height: 44,
    fontSize: '0.95rem'
  },
  '& .Mui-disabled': {
    opacity: 0.6,
  }
};

// Shared label styling (restore normal casing, remove tight letter-spacing)
const filterLabelSx: SxProps<Theme> = {
  position: 'static',
  transform: 'none',
  mb: 0.75,
  fontSize: '0.8rem',
  fontWeight: 500,
  color: '#475569',
  textTransform: 'none',
  letterSpacing: 0,
};

const filterMenuPaperSx = {
  borderRadius: 2,
  mt: 0.5,
  border: '1px solid #E2E8F0',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
};

const selectMenuProps = { PaperProps: { sx: filterMenuPaperSx } };

const Members = () => {
  const [showReason, setShowReason] = useState<boolean>(false);
  const [inActiveMember, setInactiveMember] = useState<Member | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [showFilters, setShowFilters] = useState<boolean>(false);
  const [downloading, setDownloading] = useState(false);

  // By default, show all churches and ministries
  const [filters, setFilters] = useState<MembersQuery>({
    regionId: "all",
    typeId: "all", // 'all' will fetch all types, but you can filter for 'CHURCH' or 'MINISTRY' if needed
    search: "",
    state: "all",
    councilFellowshipId: "all",
    isInEthiopia: "all",
    reportStatus: "all",
    reportYear: ((new Date()).getFullYear())-8,
    filterByReport: false,
    memberTypeChanged: 'all'
  });
  const authStore = useAppSelector((state) => state.auth);
  const { status, task, members, total, limit, page } = useAppSelector(
    (state) => state.member
  );
  const lookupStore = useAppSelector((state) => state.lookup);
  const fellowShipStore = useAppSelector((state) => state.fellowship);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const handleModalClose = () => {
    setShowReason(false);
  };
  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    dispatch(
      fetchMembers({
        page: newPage + 1,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        typeId: filters.typeId,
        councilFellowshipId: filters.councilFellowshipId,
        regionId: filters.regionId,
        state: filters.state,
        reportStatus: filters.reportStatus,
        reportYear: filters.reportYear,
        filterByReport: filters.filterByReport,
        memberTypeChanged: filters.memberTypeChanged
      })
    );
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newRows = parseInt(event.target.value, 10);
    setRowsPerPage(newRows);
    dispatch(
      fetchMembers({
        page: 1,
        limit: newRows,
        search: searchQuery || undefined,
        typeId: filters.typeId,
        councilFellowshipId: filters.councilFellowshipId,
        regionId: filters.regionId,
        state: filters.state,
        reportStatus: filters.reportStatus,
        reportYear: filters.reportYear,
        filterByReport: filters.filterByReport,
        memberTypeChanged: filters.memberTypeChanged
      })
    );
  };
  useEffect(() => {
    dispatch(fetchDataLookups({}));
    dispatch(fetchFellowships({ limit: 50 }));
  }, [dispatch]);

  const debouncedSearchUsers = useMemo(() => {
    const fn = debounce((search: string) => {
      if (search.trim() === "") {
        dispatch(
          fetchMembers({
            page: 1,
            limit: rowsPerPage,
            typeId: filters.typeId,
            councilFellowshipId: filters.councilFellowshipId,
            regionId: filters.regionId,
            state: filters.state,
            reportStatus:filters.reportStatus,
            reportYear:filters.reportYear,filterByReport:filters.filterByReport,memberTypeChanged:filters.memberTypeChanged
          })
        );
        return;
      }
      dispatch(
        fetchMembers({
          page: 1,
          limit: rowsPerPage,
          search,
          typeId: filters.typeId,
          councilFellowshipId: filters.councilFellowshipId,
          regionId: filters.regionId,
          state: filters.state,
          reportStatus:filters.reportStatus,
          reportYear:filters.reportYear,
          filterByReport:filters.filterByReport,
          memberTypeChanged:filters.memberTypeChanged
          
        })
      );
    }, 500);
    return fn;
  }, [dispatch, rowsPerPage, filters]);

  // Initial fetch and fetch when filters change
  useEffect(() => {
    dispatch(
      fetchMembers({
        page: 1,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        typeId: filters.typeId,
        councilFellowshipId: filters.councilFellowshipId,
        regionId: filters.regionId,
        state: filters.state,
        reportStatus: filters.reportStatus,
        reportYear: filters.reportYear,
        filterByReport: filters.filterByReport,
        memberTypeChanged: filters.memberTypeChanged
      })
    );
  }, [dispatch, rowsPerPage, filters, searchQuery]);

  useEffect(() => {
    return () => {
      debouncedSearchUsers.cancel?.();
    };
  }, [debouncedSearchUsers]);
  const handleSearchInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      debouncedSearchUsers(e.target.value);
    } else {
      console.log("empty search query");
      dispatch(
        fetchMembers({
          page: 1,
          limit: rowsPerPage,
          typeId: filters.typeId,
          councilFellowshipId: filters.councilFellowshipId,
          regionId: filters.regionId,
          state: filters.state,
          reportStatus:filters.reportStatus,
          reportYear:filters.reportYear,
          filterByReport:filters.filterByReport,
          memberTypeChanged:filters.memberTypeChanged
        })
      );
    }
  };
  const memberTypeOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "member_type"
  );
  const regionOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "region"
  );
  const statusOptions = lookupStore.dataLookUps.filter(
    (lookup) =>
      lookup.type === "object_state" &&
      lookup.value !== CommonObjectState.DELETED
  );
  const reportStatusOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "report_state"
  );
  const loading = status === "loading" && task === "fetch-members";
  const staffIsOwner = authStore.staff?.role.type.value === RoleType.OWNER;
  const allowedFellowshipIds = authStore.rbac?.allowedFellowshipIds || [];
  const fellowShipOptions = useMemo(
    () => (staffIsOwner
      ? fellowShipStore.fellowships
      : fellowShipStore.fellowships.filter((fellowship) => allowedFellowshipIds.includes(fellowship.id))),
    [staffIsOwner, fellowShipStore.fellowships, allowedFellowshipIds]
  );

  // Auto-select single fellowship for staff users with only one assigned fellowship
  useEffect(() => {
    if (!staffIsOwner && allowedFellowshipIds.length === 1) {
      const singleFellowshipId = allowedFellowshipIds[0];
      if (filters.councilFellowshipId !== singleFellowshipId) {
        setFilters(prev => ({ ...prev, councilFellowshipId: singleFellowshipId }));
      }
    }
  }, [allowedFellowshipIds, filters.councilFellowshipId, staffIsOwner]);

  // Ensure councilFellowshipId is always a valid option or 'all'
  useEffect(() => {
    const validFellowshipIds = fellowShipOptions.map((fellowship) => fellowship.id);
    const currentId = filters.councilFellowshipId ?? '';
    if (
      currentId !== 'all' &&
      !validFellowshipIds.includes(currentId) &&
      validFellowshipIds.length > 0
    ) {
      setFilters((prev) => ({
        ...prev,
        councilFellowshipId: !staffIsOwner && validFellowshipIds.length === 1
          ? validFellowshipIds[0]
          : 'all',
      }));
    }
  }, [fellowShipOptions, filters.councilFellowshipId, staffIsOwner]);

  // Build a merged list with Council Fellowships (Super Admin only)
  type DisplayRow = {
    id: string;
    kind: "member" | "fellowship";
    name: string;
    certificateNo?: string;
    // report status for selected year
    reportStatusValue?: string;
    reportStatusDescription?: string;
    typeDescription: string;
    stateValue?: string;
    stateDescription?: string;
  };

  const displayRows: DisplayRow[] = useMemo(() => {
    const selectedYear = filters.reportYear;
    const q = (searchQuery || "").toLowerCase();

    const mapMember = (m: Member): DisplayRow => {
      const selected = m.reports?.find((r) => r.year === selectedYear);
      return {
        id: m.id,
        kind: "member",
        name: m.name,
        certificateNo: m.certificateNo,
  reportStatusValue: selected?.status?.value ?? undefined,
        reportStatusDescription: selected?.status?.description ?? "",
        typeDescription: m.type?.description ?? "",
  stateValue: m.state?.value ?? undefined,
        stateDescription: m.state?.description ?? "",
      };
    };

    const base = members.map(mapMember);

    if (!staffIsOwner) return base;

    // If report filters are active or incompatible filters applied, don't append fellowships
    if (filters.filterByReport) return base;
    if (filters.typeId && filters.typeId !== "all") return base;
    if (filters.state && filters.state !== "all") return base;

    // Include council fellowships and apply lightweight filters
    const filteredFellowships = fellowShipOptions.filter((f) => {
      // search text
      const passSearch = !q ||
        f.name?.toLowerCase().includes(q) ||
        f.certificateNo?.toLowerCase?.().includes(q) ||
        f.city?.toLowerCase?.().includes(q);

      if (!passSearch) return false;

      // region filter
      if (filters.regionId && filters.regionId !== "all") {
        if (!f.region || f.region !== filters.regionId) return false;
      }

      // location filter
      if (filters.isInEthiopia && filters.isInEthiopia !== "all") {
        const expectInEth = filters.isInEthiopia === "yes";
        if (Boolean(f.isInEthiopia) !== expectInEth) return false;
      }

      // councilFellowshipId filter (show only that fellowship)
      if (filters.councilFellowshipId && filters.councilFellowshipId !== "all") {
        if (f.id !== filters.councilFellowshipId) return false;
      }

      return true;
    });

    const fellowshipRows: DisplayRow[] = filteredFellowships.map((f) => ({
      id: f.id,
      kind: "fellowship",
      name: f.name,
      certificateNo: f.certificateNo,
      // No report data included in fellowship fetch; leave undefined
      typeDescription: "Council Fellowship",
      // Show a neutral/active status text (no state on fellowship)
      stateValue: CommonObjectState.ACTIVE,
      stateDescription: "Active",
    }));

    // Cap appended fellowships so total rows per page don't exceed server page size
    const remainingSlots = Math.max(0, (limit || rowsPerPage) - base.length);
    return remainingSlots > 0
      ? [...base, ...fellowshipRows.slice(0, remainingSlots)]
      : base;
  }, [members, fellowShipOptions, staffIsOwner, filters.reportYear, searchQuery, filters.filterByReport, filters.typeId, filters.state, filters.regionId, filters.isInEthiopia, filters.councilFellowshipId, limit, rowsPerPage]);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const {
        state,
        regionId,
        typeId,
        isInEthiopia,
        search,
        councilFellowshipId,
        reportStatus,
        reportYear,
        filterByReport,
        memberTypeChanged
      } = filters;
      const queryParams: Record<string, string | number | boolean> = {
        _page: 1,
        _limit: 100000,
      };
      if (state && state !== "all") queryParams.stateId = state;
      if (regionId && regionId !== "all") queryParams.regionId = regionId;
      if (typeId && typeId !== "all") queryParams.typeId = typeId;
      if (isInEthiopia && isInEthiopia !== "all")
        queryParams.isInEthiopia = isInEthiopia;
      if (search) queryParams._search = search;
      if (councilFellowshipId && councilFellowshipId !== "all")
        queryParams.councilFellowshipId = councilFellowshipId;
      if(filterByReport) {
        if (reportStatus && reportStatus !== "all")  queryParams.reportStatus = reportStatus;
        queryParams.reportYear = reportYear ?? "";
      }
      if(memberTypeChanged && memberTypeChanged !== "all") {
        queryParams.memberTypeChanged = memberTypeChanged;
      }
      const response = await api.get(`/members`, {
        params: queryParams,
      });

      if (response.status === 200) {
        const apiData = response.data.data.members as unknown as Member[];

        if (!apiData || apiData.length === 0) {
          toast.warning("No data found to export");
          return;
        }

        const startYear = 2013;
        const endYear = getCurrentEthYear();
        
        const years = Array.from(
          { length: endYear - startYear + 1 },
          (_, i) => startYear + i
        );
        const data = [
          [
            "Name",
            "Certificate No",
            "Certificate Issued Date",
            "Country",
            "City",
            "Contact Phone Number",
            "Contact Email",
            "Board Member Name",
            "Board Member Phone ",
            ...years.map(year => `${year} Report Status`),
            ...years.map(year => `${year} CRV`),
            ...years.map(year => `${year} Remark`),
          ],
          ...apiData.flatMap((member) => {
            const reports = member.reports || [];
            const reportStatusByYear = years.map(year => {
              const report = reports.find(r => r.year === year);
              return report !== undefined ? report.status.description : 'Not Reported';
            });
            const reportCrvByYear = years.map(year => {
              const report = reports.find(r => r.year === year);
              return report !== undefined ? report.crv : '';
            });
            const reportRemarkByYear = years.map(year => {
              const report = reports.find(r => r.year === year);
              return report !== undefined ? report.remark : '';
            });
            
            const boardMembers = member.boardMembers || [];
            
            const memberRow = [
              member.name,
              member.certificateNo,
              member.certificateIssuedDate ? toEthiopianDateText(member.certificateIssuedDate) : '',
              member.isInEthiopia ? "Ethiopia" : member.country,
              member.city,
              member.phoneNumber,
              member.email,
              boardMembers[0]?.fullName || '',
              boardMembers[0]?.phoneNumber || '',
              ...reportStatusByYear,
             ...reportCrvByYear,
             ...reportRemarkByYear,
            ];
            
            const boardMemberRows = boardMembers
              .slice(1)
              .map((boardMember) => [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                boardMember.fullName,
                boardMember.phoneNumber,
                ...Array(years.length).fill(''),
               ...Array(years.length).fill(''),
               ...Array(years.length).fill(''),
              ]);
            return [memberRow, ...boardMemberRows];
          }),
        ];

        // Create a workbook and add the single sheet
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, sheet, "Members Report");

        // Export the workbook
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "Members_Report.xlsx");
        toast.success("Exported successfully");
      } else {
        console.error("Failed to fetch data");
        toast.error("Failed to fetch data for export");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An error occurred during export");
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <Box sx={{ px: 10, background: "#F4F5F6" }}>
      <Typography
        fontWeight={"600"}
        fontSize={"1.2rem"}
        fontFamily={"Montserrat"}
      >
        Members List
      </Typography>

      {/* Modern card wrapper for search + filters */}
      <Paper
        className="members-filters-card"
        elevation={0}
        sx={{
          mt: 2,
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          backgroundColor: "#fff",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.06)",
          position: 'sticky',
          top: 8,
          zIndex: (theme) => theme.zIndex.appBar - 1,
        }}
      >
        <Stack
          my={0}
          direction={"row"}
          width={"100%"}
          gap={2}
          flexWrap={"wrap"}
          alignItems="flex-end"
        >
          <TextField
            sx={{
              minWidth: 280,
              maxWidth: "100%",
              ...filterInputBaseStyles,
            }}
            variant="outlined"
            size="small"
            placeholder="Search name,city,certificate"
            InputProps={{
              sx: {
                height: 44,
                borderRadius: 2,
              },
              startAdornment: (
                <InputAdornment position="start" sx={{ m: 0 }}>
                  <SearchOutlinedIcon sx={{ color: '#1D1B20', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            inputProps={{ style: { padding: '0 12px', lineHeight: '44px', height: 44 } }}
            onChange={(e) => handleSearchInput(e)}
          />

          <FormControl sx={{ minWidth: 200, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="council-fellowship-label" sx={filterLabelSx}>Council Fellowship</InputLabel>
            <Select
              labelId="council-fellowship-label"
              id="council-fellowship-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.councilFellowshipId}
              onChange={(e) =>
                setFilters({ ...filters, councilFellowshipId: e.target.value })
              }
              MenuProps={selectMenuProps}
            >
              {(staffIsOwner || fellowShipOptions.length > 1) && (
                <MenuItem value="all">
                  {staffIsOwner ? "All" : "All assigned fellowships"}
                </MenuItem>
              )}
              {fellowShipOptions.length > 0 &&
                fellowShipOptions.map((fellowship) => (
                  <MenuItem key={fellowship.id} value={fellowship.id}>
                    {fellowship.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 140, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="institution-type-label" sx={filterLabelSx}>Institution Type</InputLabel>
            <Select
              labelId="institution-type-label"
              id="institution-type-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.typeId}
              onChange={(e) => {
                setFilters({ ...filters, typeId: e.target.value });
              }}
              MenuProps={selectMenuProps}
            >
              <MenuItem value={"all"}>All</MenuItem>
              {memberTypeOptions.length > 0 &&
                memberTypeOptions.map((memberType) => (
                  <MenuItem key={memberType.id} value={memberType.id}>
                    {memberType.description}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="institution-status-label" sx={filterLabelSx}>Institution Status</InputLabel>
            <Select
              labelId="institution-status-label"
              id="institution-status-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              MenuProps={selectMenuProps}
            >
              <MenuItem value={"all"}>All</MenuItem>
              {statusOptions.length > 0 &&
                statusOptions.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.description}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="region-label" sx={filterLabelSx}>Region</InputLabel>
            <Select
              labelId="region-label"
              id="region-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.regionId}
              onChange={(e) => setFilters({ ...filters, regionId: e.target.value })}
              MenuProps={selectMenuProps}
            >
              <MenuItem value={"all"}>All</MenuItem>
              {regionOptions.length > 0 &&
                regionOptions.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.description}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="institution-location-label" sx={filterLabelSx}>Institution Location</InputLabel>
            <Select
              labelId="institution-location-label"
              id="institution-location-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.isInEthiopia}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  isInEthiopia: e.target.value,
                });
              }}
              MenuProps={selectMenuProps}
            >
              <MenuItem value={"all"}>All</MenuItem>
              {[
                { name: "የሀገር ውስጥ ተቋም", id: "yes" },
                { name: "የውጭ ሀገር ተቋም", id: "no" },
              ].map((locationType) => (
                <MenuItem key={locationType.id} value={locationType.id}>
                  {locationType.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
            <InputLabel id="institution-type-change-label" sx={filterLabelSx}>Institution Type Change</InputLabel>
            <Select
              labelId="institution-type-change-label"
              id="institution-type-change-select"
              sx={{ ...filterInputBaseStyles }}
              displayEmpty
              required
              value={filters.memberTypeChanged}
              onChange={(e) => setFilters({ ...filters, memberTypeChanged: e.target.value })}
              MenuProps={selectMenuProps}
            >
              <MenuItem value={"all"}>All</MenuItem>
              {[
                { name: "የቀየሩ", id: "changed" },
                { name: "ያልቀየሩ", id: "not_changed" },
              ].map((memberStatusChange) => (
                <MenuItem key={memberStatusChange.id} value={memberStatusChange.id}>
                  {memberStatusChange.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 150, maxWidth: '100%' }}>
              {/* Hidden label to align with other controls' labels */}
              <InputLabel sx={{ position: 'static', transform: 'none', mb: 0.5, fontSize: '0.95rem', color: '#6b7280', visibility: 'hidden' }}>Filter</InputLabel>
              <Button
                variant="outlined"
                sx={{
                  height: 44,
                  color: "#374151",
                  borderColor: "#D1D5DB",
                  borderRadius: 2,
                  borderWidth: "1px",
                  fontSize: "0.9rem",
                  textTransform: "none",
                  fontWeight: theme.typography.fontWeightRegular,
                  px: 1.5,
                  '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#9CA3AF' },
                }}
                onClick={() => setFilters({ ...filters, filterByReport: !filters.filterByReport })}
              >
                Filter by Report
              </Button>
            </Box>

            {filters.filterByReport && (
              <>
                <FormControl sx={{ minWidth: 150, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
                  <InputLabel id="report-year-label" sx={filterLabelSx}>Report Year</InputLabel>
                  <Select
                    labelId="report-year-label"
                    id="report-year-select"
                    sx={{ ...filterInputBaseStyles }}
                    displayEmpty
                    required
                    value={filters.reportYear}
                    onChange={(e) => {
                      setFilters({ ...filters, reportYear: Number(e.target.value) });
                    }}
                    MenuProps={{ PaperProps: { sx: { ...filterMenuPaperSx, maxHeight: 200, overflowY: 'auto' } } }}
                  >
                    <MenuItem value={""}>Choose year</MenuItem>
                    {Array.from(
                      { length: ((new Date().getFullYear()) - 8) - 2013 + 1 },
                      (_, i) => 2013 + i
                    ).map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120, maxWidth: "100%", ...filterInputBaseStyles }} variant="outlined" size="small">
                  <InputLabel id="report-status-label" sx={filterLabelSx}>Report Status</InputLabel>
                  <Select
                    labelId="report-status-label"
                    id="report-status-select"
                    sx={{ ...filterInputBaseStyles }}
                    displayEmpty
                    required
                    value={filters.reportStatus}
                    onChange={(e) => setFilters({ ...filters, reportStatus: e.target.value })}
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value={"all"}>All</MenuItem>
                    {reportStatusOptions.length > 0 &&
                      reportStatusOptions.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.description}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* ...existing code for results text, table, etc... */}
      {!loading && (
        <Typography
          component={"p"}
          fontFamily={"Montserrat"}
          fontWeight={"400"}
          fontStyle={"italic"}
          m={1}
        >
          {total} Results found
        </Typography>
      )}
      <TableContainer
        component={Paper}
        sx={{
          scrollbarWidth: "thin",
          background: (theme) => theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
          boxShadow: "none",
          mt: 1,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        <Table
          stickyHeader
          sx={{ minWidth: 700, borderSpacing: "0 8px" }}
          aria-label="customized table"
        >
          <TableHead>
            <TableRow>
              <StyledTableCell
                align="left"
                sx={{
                  background: "none !important",
                  color: "#8F8F8F !important",
                  fontWeight: "500",
                  fontFamily: "Inter",
                }}
              >
                Certificate Number
              </StyledTableCell>
              <StyledTableCell
                align="left"
                sx={{
                  background: "none !important",
                  color: "#8F8F8F !important",
                  fontWeight: "500",
                  fontFamily: "Inter",
                }}
              >
                Name of institution
              </StyledTableCell>
              {filters.filterByReport &&  <StyledTableCell
                align="left"
                sx={{
                  background: "none !important",
                  color: "#8F8F8F !important",
                  fontWeight: "500",
                  fontFamily: "Inter",
                }}
              >
                Report Status
              </StyledTableCell>}
             
              <StyledTableCell
                align="center"
                sx={{
                  background: "none !important",
                  color: "#8F8F8F !important",
                  fontWeight: "500",
                  fontFamily: "Inter",
                }}
              >
                Institution Type
              </StyledTableCell>
              <StyledTableCell
                align="center"
                sx={{
                  background: "none !important",
                  color: "#8F8F8F !important",
                  fontWeight: "500",
                  fontFamily: "Inter",
                }}
              >
                Institution Status
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <MembersTableLoading />
            ) : (
              <>
                {displayRows.map((row) =>{
                  return (
                   <StyledTableRow
                     key={row.id}
                     onClick={() => {
                       if (row.kind === 'member') {
                         const m = members.find(mm => mm.id === row.id);
                         if (m && m.state && m.state.value === CommonObjectState.IN_ACTIVE) {
                           if (staffIsOwner) {
                             navigate({ to: `/members/${row.id}` });
                           } else {
                             setShowReason(true);
                             setInactiveMember(m);
                           }
                         } else {
                           navigate({ to: `/members/${row.id}` });
                         }
                       } else {
                         navigate({ to: `/council-fellowship`, search: { editId: row.id } });
                       }
                     }}
                   >
                     <StyledTableCell align="center">
                       {formatCertificateNumber(row.certificateNo)}
                     </StyledTableCell>
  
                     <StyledTableCell align="left">
                       {row.name}
                     </StyledTableCell>
                     {filters.filterByReport &&   <StyledTableCell align="left">
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.5,
      color: row.stateValue === 'object_state_active' ? '#3B82F6' : '#9E9E9E', // Blue for active, gray for others
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: row.stateValue === 'object_state_active' ? '#3B82F640' : '#9E9E9E40', // Blue background for active, gray for others
        p: 0.15,
        borderRadius: "50%",
      }}
    >
      <FiberManualRecordIcon />
    </Box>
    {row.reportStatusDescription}
  </Box>
</StyledTableCell>}
                   
                     <StyledTableCell align="center">
                       {row.typeDescription}
                     </StyledTableCell>
                     <StyledTableCell align="center">
                       <Box
                         sx={{
                           px: 2,
                           py: 0.5,
                           borderRadius: 6,
                           width: "fit-content",
                           background: `${objectStatusColor(row.stateValue || CommonObjectState.ACTIVE)}40`,
                           color: objectStatusColor(row.stateValue || CommonObjectState.ACTIVE),
                           fontWeight: "500",
                           mx: "auto",
                         }}
                       >
                         {row.stateDescription || '—'}
                       </Box>
                     </StyledTableCell>
                   </StyledTableRow>
                 )
                }
               )}
              </>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>
                <Button
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    fontFamily: "Inter",
                    fontWeight: "600",
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
                    px: 2.5,
                  }}
                  onClick={handleExport}
                  disabled={downloading}
                >
                 {downloading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Exporting{" "}
                  <CircularProgress sx={{ color: "white" }} size={20} />
                </Box>
              ) : (
                "Export"
              )}
                </Button>
              </TableCell>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={8}
                count={total}
                rowsPerPage={limit}
                page={total === 0 ? 0 : page - 1}
                slotProps={{
                  select: {
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: true,
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Dialog
        open={showReason}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        keepMounted
      >
        {showReason && inActiveMember && (
          <InactiveMemberReason
            handleModalClose={handleModalClose}
            member={inActiveMember}
          />
        )}
      </Dialog>
    </Box>
  );
};
interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}
interface InactiveMemberProps {
  member: Member;
  handleModalClose: () => void;
}
const InactiveMemberReason: React.FC<InactiveMemberProps> = ({
  member,
  handleModalClose,
}) => {
  return (
    <Box sx={{ p: 2, minWidth: 400, width: "fit-content" }}>
      <Stack
        direction={"row"}
        width={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography
          fontFamily={"Montserrat"}
          fontWeight={"500"}
          color="#FFA500"
        >
          Member is inactive
        </Typography>
        <IconButton onClick={handleModalClose}>
          <CloseIcon fontSize="small" sx={{ color: "black" }} />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography fontFamily={"Montserrat"} fontWeight={"500"} color="black">
        Reason : {member.reasonForInactive}
      </Typography>
    </Box>
  );
};
export default Members;
