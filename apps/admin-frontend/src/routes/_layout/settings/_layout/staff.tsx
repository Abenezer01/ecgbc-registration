import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import theme from "../../../../theme";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import StyledTableRow, {
  StyledTableCell,
} from "../../../../components/shared/TableComponents";
import { ProfileDetailLoading } from "../../../../components/shared/Loaders";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { useEffect, useState } from "react";
import { fetchStaffs } from "../../../../store/features/staff.slice";
import { imageUrl } from "../../../../utils/image-url.util";
import CreateStaff from "../../../../components/staff/CreateStaff";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import { objectStatusColor } from "../../../../utils/state-color.util";
import EditStaff from "../../../../components/staff/EditStaff";
import { Staff } from "../../../../types/model/staff.model";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import { Permissions } from "../../../../enums/permission.enum";
import { userHasPermission } from "../../../../utils/hasPermission.util";
import ActionMenu from "../../../../components/shared/ActionMenu";

export const Route = createFileRoute("/_layout/settings/_layout/staff")({
  component: () => <Staffs />,
});
const Staffs = () => {
  const [createStaff, setCreateStaff] = useState<boolean>(false);
  const [editStaff, setEditStaff] = useState<boolean>(false);
  const [updatedStaff, setUpdatedStaff] = useState<Staff | null>(null);
  const [paginationPage, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { status, task, staffs, total, limit, page  } = useAppSelector((state) => state.staff);
  const {staff } = useAppSelector((state) => state.auth);
  const loggedinStaff = staff;
  const dispatch = useAppDispatch();  useEffect(() => {
    dispatch(
      fetchStaffs({
        page: paginationPage + 1,
        limit: rowsPerPage,
      })
    );
  }, [dispatch, paginationPage, rowsPerPage]);
  const closeCreateStaff = () => setCreateStaff(false);
  const closeEditStaff = () => setEditStaff(false);
  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const loading = status === "loading" && task === "fetch-staffs";

  return (
    <Box
      sx={{
        mx: "auto",
        width: "100%",
        px: { xs: 0, md: 2 },
        boxShadow: "none",
      }}
    >
      {/* Header toolbar */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent={"space-between"} px={1} spacing={1.5}>
        <Typography component={"h2"} fontSize={"1rem"} fontWeight={theme.typography.fontWeightBold}>
          Staff List
        </Typography>
        {userHasPermission(loggedinStaff?.role?.permissions??[],[Permissions.STAFF_ADD,]) && (
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
            onClick={() => {
              setEditStaff(false);
              setCreateStaff(!createStaff);
            }}
          >
            Add new staff
          </Button>
        )}
      </Stack>
      <CreateStaff show={createStaff} closeCreateStaff={closeCreateStaff} />
      {updatedStaff && (
        <EditStaff
          show={editStaff}
          staff={updatedStaff}
          closeEditStaff={closeEditStaff}
        />
      )}
      <Divider sx={{ my: 2 }} />
      <TableContainer
        component={Paper}
        className="modern-card-hover"
        sx={{
          scrollbarWidth: "thin",
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          background: theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: 700,
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            "& thead th": {
              backgroundColor: theme.palette.grey[50],
              color: theme.palette.text.secondary,
              fontWeight: theme.typography.fontWeightMedium,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }}
          aria-label="customized table"
        >
          <TableHead>
            <TableRow>
              <StyledTableCell align="left">Staff</StyledTableCell>
              <StyledTableCell align="left">Phone</StyledTableCell>
              <StyledTableCell align="left">Role</StyledTableCell>
              <StyledTableCell align="center">State</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <StyledTableRow sx={{ mt: 4 }}>
                <StyledTableCell component="th" scope="row" colSpan={8}>
                  <ProfileDetailLoading />
                </StyledTableCell>
              </StyledTableRow>
            )}
            {!loading &&
              staffs.map((staff) => (
                <StyledTableRow key={staff.id}>
                  <StyledTableCell align="center">
                    <Stack direction="row" alignItems={"center"} gap={1}>
                      <Avatar
                        alt={staff.firstName}
                        src={imageUrl("avatar", staff.avatar!)}
                      />
                      <Stack alignItems={"flex-start"}>
                        <Typography component={"h4"} variant="body1">
                          {" "}
                          {staff.fullName}
                        </Typography>
                        <Typography
                          component={"h4"}
                          variant="body2"
                          color="#6D6D6D"
                        >
                          {" "}
                          {staff.email}
                        </Typography>
                      </Stack>
                    </Stack>
                  </StyledTableCell>

                  <StyledTableCell align="left">
                    {staff.phoneNumber ? staff.phoneNumber : "-"}
                  </StyledTableCell>
                  <StyledTableCell align="left">
                    {staff.role.name}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: objectStatusColor(staff.state?.value ?? ""),
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${objectStatusColor(staff.state?.value ?? "")}40`,
                          p: 0.15,
                          borderRadius: "50%",
                        }}
                      >
                        <FiberManualRecordIcon />
                      </Box>

                      {staff.state?.description}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                  <ActionMenu
                      items={[
                        {
                          label: "Edit",
                          icon: <ModeEditOutlineIcon fontSize="small" />,
                          onClick: () => {
                            setCreateStaff(false);
                            setEditStaff(true);
                            setUpdatedStaff(staff);
                          },
                          hidden: !userHasPermission(loggedinStaff?.role?.permissions??[],[Permissions.STAFF_CHANGE,])
                        },
                      ]}
                      size="small"
                      buttonText="Actions"
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
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
