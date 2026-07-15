import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchFellowships } from "../../store/features/fellowship.slice";
import {
  Box,
  Button,
  Dialog,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  TablePagination,
} from "@mui/material";
import theme from "../../theme";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SearchIcon from "@mui/icons-material/Search";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";

import { CouncilFellowship } from "../../types/model/fellowship.model";
import StyledTableRow, { StyledTableCell } from "../shared/TableComponents";
import { ProfileDetailLoading } from "../shared/Loaders";
import CreateFellowship from "./CreateFellowship";
import EditFellowship from "./EditFellowship";
import { Transition } from "../shared/ModalTransition";
import { Permissions } from "../../enums/permission.enum";
import { userHasPermission } from "../../utils/hasPermission.util";
import { formatCertificateNumber } from "../../utils/memberUtils";
import { useNavigate, useSearch } from "@tanstack/react-router";

interface Props { editId?: string }
const CouncilFellowships: React.FC<Props> = ({ editId }) => {
  const [createFellowship, setCreateFellowship] = useState<boolean>(false);
  const [editFellowship, setEditFellowship] = useState<boolean>(false);
  const [updatedFellowship, setUpdatedFellowship] = useState<CouncilFellowship | null>(null);

  const closeCreateFellowship = () => setCreateFellowship(false);
  const closeEditFellowship = () => setEditFellowship(false);

  const { status, task, fellowships } = useAppSelector(
    (state) => state.fellowship
  );
  const {staff} = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  // read editId from search param as well
  const search = useSearch({ from: "/_layout/council-fellowship/" });
  const searchEditId = (search as { editId?: string } | undefined)?.editId;

  useEffect(() => {
    dispatch(fetchFellowships({limit:50}));
  }, [dispatch]);

  useEffect(() => {
    const eid = editId || searchEditId;
    if (eid && fellowships.length > 0) {
      const f = fellowships.find(x => x.id === eid) || null;
      if (f) {
        setUpdatedFellowship(f);
        setEditFellowship(true);
        // Clear the editId from the URL to avoid re-opening on refresh/back
        navigate({
          to: "/council-fellowship",
          replace: true,
          search: (prev) => {
            const rest: Record<string, unknown> = { ...((prev as Record<string, unknown>) || {}) };
            if ("editId" in rest) {
              delete (rest as { [k: string]: unknown }).editId;
            }
            return rest;
          },
        });
      }
    }
  }, [editId, searchEditId, fellowships, navigate]);

  const loading = status === "loading" && task === "fetch-fellowships";

  // UI-only: search, density, pagination
  const [searchText, setSearchText] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = fellowships.filter((f) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.certificateNo ? String(f.certificateNo).toLowerCase().includes(q) : false)
    );
  });
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box
      sx={{
        mx: "auto",
        width: "100%",
        px: 10,
        boxShadow: "none",
      }}
    >
      {/* Gradient header band for visual cohesion */}
      <Box
        sx={{
          height: 6,
          width: "100%",
          borderRadius: 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          mb: 2,
        }}
      />

      <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} px={2}>
        <Typography component={"h2"} fontSize={"1rem"} fontWeight={theme.typography.fontWeightBold}>
          Council Fellowship List
        </Typography>
        {userHasPermission(staff?.role?.permissions??[],[Permissions.COUNCIL_FELLOWSHIP_ADD]) &&  (
          <Button
            variant="contained"
            sx={{
              color: "white",
              borderRadius: 2,
              fontSize: "0.9rem",
              textTransform: "none",
              fontWeight: theme.typography.fontWeightMedium,
              py: 0.75,
              px: 1.25,
              "& .MuiButton-icon": { mr: 0.5 },
            }}
            startIcon={<AddOutlinedIcon sx={{ color: "white", height: 16 }} />}
            onClick={() => setCreateFellowship(!createFellowship)}
          >
            Add new Council Fellowship
          </Button>
        )}
      </Stack>
      {createFellowship && (
        <CreateFellowship closeCreateFellowship={closeCreateFellowship} />
      )}

      {/* Toolbar: search + density */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" px={2} sx={{ mt: 1, mb: 1 }}>
        <TextField
          fullWidth
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
          placeholder="Search by name or certificate no"
          size="medium"
          sx={{ flex: 1, minWidth: { xs: "100%", sm: 360 }, maxWidth: 640, "& .MuiInputBase-input": { py: 1.2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            "aria-label": "search fellowships",
          }}
        />
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">Density</Typography>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={density}
            onChange={(_, v) => v && setDensity(v)}
          >
            <ToggleButton value="comfortable">Comfortable</ToggleButton>
            <ToggleButton value="compact"><DensityMediumIcon fontSize="small" sx={{ mr: 0.5 }} />Compact</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1 }} />

      <TableContainer
        component={Paper}
        className="modern-card-hover"
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          background: theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
        }}
      >
        <Table
          stickyHeader
          size={density === "compact" ? "small" : "medium"}
          sx={{
            minWidth: 700,
            borderCollapse: "separate",
            borderSpacing: density === "compact" ? "0 6px" : "0 8px",
            "& thead th": {
              backgroundColor: theme.palette.grey[50],
              color: theme.palette.text.secondary,
              fontWeight: theme.typography.fontWeightMedium,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }}
          aria-label="council fellowship table"
        >
          <TableHead>
            <TableRow>
              <StyledTableCell align="left">Name</StyledTableCell>
              <StyledTableCell align="left">Certificate No</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <StyledTableRow sx={{ mt: 4 }}>
                <StyledTableCell component="th" scope="row" colSpan={2}>
                  <ProfileDetailLoading />
                </StyledTableCell>
              </StyledTableRow>
            )}

            {!loading && filtered.length === 0 && (
              <StyledTableRow>
                <StyledTableCell colSpan={2} align="center">
                  <Box sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      No council fellowships found.
                    </Typography>
                    {userHasPermission(staff?.role?.permissions??[],[Permissions.COUNCIL_FELLOWSHIP_ADD]) && (
                      <Button variant="contained" startIcon={<AddOutlinedIcon sx={{ color: "white", height: 16 }} />} onClick={() => setCreateFellowship(true)}>
                        Add new Council Fellowship
                      </Button>
                    )}
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            )}

            {!loading &&
              paginated.map((fellowship) => (
                <StyledTableRow 
                  key={fellowship.id}
                  onClick={() => navigate({ to: `/council-fellowship/${fellowship.id}` })}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                >
                  <StyledTableCell align="left">{fellowship.name}</StyledTableCell>
                  <StyledTableCell align="left">{formatCertificateNumber(fellowship.certificateNo)}</StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
        {!loading && filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </TableContainer>
      <Dialog
        open={editFellowship}
        onClose={closeEditFellowship}
        TransitionComponent={Transition}
        keepMounted
        sx={{
          "& .MuiDialog-container": { "& .MuiPaper-root": { scrollbarWidth: "thin", overflowX: "clip" } },
        }}
        maxWidth={"lg"}
      >
        {editFellowship && updatedFellowship && (
          <EditFellowship handleModalClose={closeEditFellowship} fellowship={updatedFellowship} />
        )}
      </Dialog>
    </Box>
  );
};

export default CouncilFellowships;
