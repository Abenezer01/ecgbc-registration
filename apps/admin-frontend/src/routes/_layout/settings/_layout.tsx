import { Box, MenuItem } from "@mui/material";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import theme from "../../../theme";
import { useAppSelector } from "../../../store/store";
import { userHasPermission } from "../../../utils/hasPermission.util";
import { Permissions } from "../../../enums/permission.enum";

export const Route = createFileRoute("/_layout/settings/_layout")({
  component: () => <Settings />,
});

const Settings = () => {
  const { staff } = useAppSelector((state) => state.auth);
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          px: 10,
          py: 5,
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            background: "#E3E3E3",
            p: 0.25,
            borderRadius: 2,
            gap: 2,
          }}
          mb={4}
        >
          <MenuItem
            sx={{
              p: 0,
              "& a": {
                color: "#757575",
                textDecoration: "none",
                fontWeight: theme.typography.fontWeightMedium,
                padding: "0.5rem 0.75rem",
              },
              "& .active": {
                color: "black",
                background: "white",
                borderRadius: 2,
              },
            }}
          >
            <Link to={"/settings/profile"} className="[&.active]:active-nav">
              Profile Management
            </Link>
          </MenuItem>
          {userHasPermission(staff?.role?.permissions??[],[Permissions.STAFF_VIEW,]) &&   <MenuItem
                sx={{
                  p: 0,

                  "& a": {
                    color: "#757575",
                    textDecoration: "none",
                    fontWeight: theme.typography.fontWeightMedium,
                    padding: "0.5rem 0.75rem",
                  },
                  "& .active": {
                    color: "black",
                    background: "white",
                    borderRadius: 2,
                  },
                }}
              >
                <Link to={"/settings/staff"} className="[&.active]:active-nav">
                  Staff Management
                </Link>
              </MenuItem> }
        {userHasPermission(staff?.role?.permissions??[],[Permissions.ROLE_VIEW,]) &&   <MenuItem
                sx={{
                  p: 0,

                  "& a": {
                    color: "#757575",
                    textDecoration: "none",
                    fontWeight: theme.typography.fontWeightMedium,
                    padding: "0.5rem 0.75rem",
                  },
                  "& .active": {
                    color: "black",
                    background: "white",
                    borderRadius: 2,
                  },
                }}
              >
                <Link to={"/settings/role"} className="[&.active]:active-nav">
                  Role Management
                </Link>
              </MenuItem> }
           
        </Box>

        <Outlet />
      </Box>
    </>
  );
};
