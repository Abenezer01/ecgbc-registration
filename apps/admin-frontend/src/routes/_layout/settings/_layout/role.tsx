import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import theme from "../../../../theme";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import StyledTableRow, {
  StyledTableCell,
} from "../../../../components/shared/TableComponents";
import { ProfileDetailLoading } from "../../../../components/shared/Loaders";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { useEffect, useState } from "react";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { fetchRoles } from "../../../../store/features/role.slice";
import CreateRole from "../../../../components/role/CreateRole";
import EditRole from "../../../../components/role/EditRole";
import { Role } from "../../../../types/model/role.model";
import { userHasPermission } from "../../../../utils/hasPermission.util";
import { Permissions } from "../../../../enums/permission.enum";
import ActionMenu from "../../../../components/shared/ActionMenu";

export const Route = createFileRoute("/_layout/settings/_layout/role")({
  component: () => <Roles />,
});

const Roles = () => {
  const [createRole, setCreateRole] = useState<boolean>(false);
  const [editRole, setEditRole] = useState<boolean>(false);
  const [updatedRole, setUpdatedRole] = useState<Role | null>(null);
  const { status, task, roles } = useAppSelector((state) => state.role);
  const {staff}= useAppSelector((state)=>state.auth)
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchRoles({}));
  }, [dispatch]);
  const closeCreateRole = () => {
    setCreateRole(false);
  };
  const closeEditRole = () => setEditRole(false);

  const loading = status === "loading" && task === "fetch-roles";

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
          Role List
        </Typography>
        {userHasPermission(staff?.role?.permissions??[],[Permissions.ROLE_ADD,]) && (
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
              setCreateRole(!createRole);
              setEditRole(false);
            }}
          >
            Add new role
          </Button>
        )}
      </Stack>
      <CreateRole show={createRole} closeCreateRole={closeCreateRole} />
      {updatedRole && (
        <EditRole
          show={editRole}
          role={updatedRole}
          closeEditRole={closeEditRole}
        />
      )}
      <Divider sx={{ my: 2 }} />

      {/* Modernized table container */}
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
              <StyledTableCell align="left">Name</StyledTableCell>
              <StyledTableCell align="left">Description</StyledTableCell>
              <StyledTableCell align="left">Permissions</StyledTableCell>
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
              roles.map((role) => (
                <StyledTableRow key={role.id}>
                  <StyledTableCell align="left">{role.name}</StyledTableCell>
                  <StyledTableCell align="left">
                    {role.description}
                  </StyledTableCell>

                  {/* Permissions count as a compact pill */}
                  <StyledTableCell align="left">
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1,
                        py: 0.25,
                        borderRadius: 999,
                        bgcolor: "#F3F4F6",
                        color: "#374151",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: theme.palette.primary.main }} />
                      {role.permissions.length} Permissions
                    </Box>
                  </StyledTableCell>

                  {/* Action */}
                  <StyledTableCell align="center">
                    <ActionMenu
                      items={[{
                        label: "Edit",
                        icon: <ManageAccountsIcon fontSize="small" />,
                        onClick: () => { setEditRole(true); setCreateRole(false); setUpdatedRole(role); },
                        hidden: !userHasPermission(staff?.role?.permissions??[],[Permissions.ROLE_CHANGE,])
                      }]}
                      size="small"
                      buttonText="Actions"
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
