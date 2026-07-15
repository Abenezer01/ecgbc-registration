import {
  AppBar,
  Avatar,
  Box,
  Grid2,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import Logo from "../assets/CouncilLogo.png";
import theme from "../theme";
import { useState } from "react";
import { useAppSelector } from "../store/store";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ArrowDropDownOutlinedIcon from "@mui/icons-material/ArrowDropDownOutlined";
import { imageUrl } from "../utils/image-url.util";
import { userHasPermission } from "../utils/hasPermission.util";
import { Permissions } from "../enums/permission.enum";
export const Route = createFileRoute("/_layout")({
  component: () => <Header />,
});

const Header = () => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { isAuthenticated, token, staff } = useAppSelector(
    (state) => state.auth
  );
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  if (!isAuthenticated && token == null) {
    console.log("User not authenticated");
    return <Navigate to="/" />;
  }

  return (
    <>
      <AppBar position="sticky" sx={{ background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`, top: 0, zIndex: (theme) => theme.zIndex.appBar }}>
        <Grid2
          component={Paper}
          elevation={0}
          sx={{
            px: { xs: 2, md: 8 },
            py: 1,
            m: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: 'white',
            background: 'transparent'
          }}
        >
          <Box
            sx={{
              "& a": {
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontWeight: theme.typography.fontWeightBold,
                color: "white",
              },
            }}
          >
            <Link to="/">
              <Box component={"img"} src={Logo} height={40} />
              Registrar Admin Dashboard
            </Link>
          </Box>
          <Stack direction={"row"} gap={2} alignItems={"center"}>
            {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_ADD,])  && (
              <Box
                sx={{
                  "& a": {
                    color: "white",
                    textTransform: "none",
                    fontWeight: theme.typography.fontWeightBold,
                    boxShadow: "none",
                    borderRadius: 1,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    px: 1.5,
                    py: 0.75,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: "0.8rem",
                    gap: 0.75,
                    whiteSpace: "nowrap",
                    border: '1px solid rgba(255,255,255,0.2)'
                  },
                }}
              >
                <Link to={`/members/add`}>Add Member</Link>
              </Box>
            )}

            <Toolbar disableGutters sx={{ justifyContent: "flex-end" }}>
              <Box sx={{ flexGrow: 0 }}>
                <Box
                  onClick={handleOpenUserMenu}
                  sx={{ p: 0, display: "flex", gap: 0.5, cursor: "pointer" }}
                >
                  <Avatar
                    sx={{
                      height: "24px",
                      width: "24px",
                      backgroundColor: theme.palette.primary.main,
                    }}
                    alt={(staff?.firstName?.[0] ?? 'U') as string}
                    src={staff?.avatar ? imageUrl("avatar", staff.avatar) : undefined}
                  />
                  <Typography component={"p"}>{staff?.fullName}</Typography>
                  <ArrowDropDownOutlinedIcon />
                </Box>

                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    sx={{
                      "& a": {
                        display: "flex",
                        textDecoration: "none",
                        color: "black",
                      },
                    }}
                  >
                    <Link to={`/settings/profile`}>
                      <PersonOutlinedIcon fontSize="small" />
                      <Typography textAlign="center" sx={{ ml: 1 }}>
                        Profile
                      </Typography>
                    </Link>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/';
                    }}
                  >
                    <LogoutOutlinedIcon fontSize="small" />
                    <Typography textAlign="center" sx={{ ml: 1 }}>
                      Logout
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </Stack>
        </Grid2>
      </AppBar>
      <Outlet />
    </>
  );
};
