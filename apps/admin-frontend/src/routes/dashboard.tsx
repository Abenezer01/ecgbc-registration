import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  AppBar,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ArrowDropDownOutlinedIcon from "@mui/icons-material/ArrowDropDownOutlined";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import Fade from '@mui/material/Fade';
import ColorLogo from '../assets/CouncilLogo.png';

import { logout } from "../store/features/auth.slice";
import Statistics from "../components/dashboard/Statistics";
import Members from "../components/members/Members";
import { imageUrl } from "../utils/image-url.util";
import { userHasPermission } from "../utils/hasPermission.util";
import { Permissions } from "../enums/permission.enum";
import { RoleType } from "../enums/role-type.enum";

export const Route = createFileRoute("/dashboard")({
  component: () => <Dashboard />,
});

const Dashboard = () => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { isAuthenticated, token, staff } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();

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
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg,#2563eb 0%, #3b82f6 50%, #1d4ed8 100%)',
          color: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          border: 'none'
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 3, md: 6 },
            py: { xs: 1.25, md: 1.75 }, // increased vertical padding
            minHeight: { xs: 76, md: 96 }, // increased overall height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3
          }}
        >
          {/* Left: Logo stacked with title */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexShrink: 0 }}>
            <Box
              component="img"
              src={ColorLogo}
              alt="Council Logo"
              sx={{ height: { xs: 50, md: 56 }, width: 'auto', display: 'block' }}
            />
            <Stack spacing={0.5}>
              <Typography
                fontSize={{ xs: '0.65rem', md: '0.7rem' }}
                fontWeight={500}
                letterSpacing={0.5}
                sx={{ opacity: 0.85 }}
                fontFamily={'Inter, Poppins, sans-serif'}
                color={'#E0EAFB'}
              >
                Ethiopian Council of Gospel Believers’ Churches
              </Typography>
              <Typography
                fontSize={{ xs: '1.05rem', md: '1.45rem' }}
                fontWeight={700}
                lineHeight={1.1}
                letterSpacing={0.3}
                fontFamily={'Inter, Poppins, sans-serif'}
                color={'#FFFFFF'}
              >
                Registrar Admin Dashboard
              </Typography>
            </Stack>
          </Stack>

          {/* Right: Actions */}
          <Stack direction="row" alignItems="center" spacing={3}>
            {userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_ADD]) && (
              <Box>
                <Link
                  to={`/members/add`}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    component={'span'}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 3,
                      py: 1.1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: 999,
                      backgroundColor: '#FFFFFF',
                      color: '#1d4ed8',
                      transition: 'background-color .18s ease, box-shadow .18s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      '&:hover': {
                        backgroundColor: '#f3f4f6'
                      }
                    }}
                  >
                    <AddCircleIcon fontSize="small" sx={{ color: '#1d4ed8' }} />
                    Add Member
                  </Box>
                </Link>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                onClick={handleOpenUserMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  transition: 'background-color .15s ease',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.18)' }
                }}
              >
                <Avatar
                  sx={{
                    height: 40,
                    width: 40,
                    bgcolor: 'rgba(255,255,255,0.25)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    border: '2px solid rgba(255,255,255,0.35)'
                  }}
                  alt={(staff?.firstName?.[0] ?? 'U') as string}
                  src={staff?.avatar ? imageUrl('avatar', staff.avatar) : undefined}
                />
                <Stack spacing={0} sx={{ minWidth: 0, color: '#FFFFFF' }}>
                  <Typography
                    component={'span'}
                    fontSize={'0.78rem'}
                    fontWeight={700}
                    sx={{ maxWidth: 140, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', letterSpacing: 0.4 }}
                  >
                    {staff?.role?.type?.value === RoleType.OWNER ? 'Super Admin' : (staff?.fullName || 'User')}
                  </Typography>
                  <Typography
                    component={'span'}
                    fontSize={'0.6rem'}
                    fontWeight={400}
                    sx={{ letterSpacing: 0.6, opacity: 0.85 }}
                  >
                    {staff?.role?.type?.value === RoleType.OWNER ? 'Owner Role' : (staff?.role?.type?.description || 'Role')}
                  </Typography>
                </Stack>
                <ArrowDropDownOutlinedIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
              </Box>
              <Menu
                TransitionComponent={Fade}
                transitionDuration={140}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                slotProps={{
                  paper: {
                    sx: (theme) => ({
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 200,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
                      py: 0.5,
                      backgroundColor: '#ffffff',
                      '& .MuiMenuItem-root': {
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        borderRadius: 1,
                        mx: 0.5,
                        '&:hover': { backgroundColor: 'rgba(37,99,235,0.08)' }
                      }
                    })
                  }
                }}
              >
                <MenuItem onClick={handleCloseUserMenu} sx={{ p: 0 }}>
                  <Link
                    to={`/settings/profile`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      color: 'inherit',
                      textDecoration: 'none',
                      width: '100%'
                    }}
                  >
                    <PersonOutlinedIcon fontSize="small" />
                    <Typography fontSize={'0.75rem'} fontWeight={500}>Profile</Typography>
                  </Link>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleCloseUserMenu();
                    dispatch(logout());
                  }}
                  sx={{ gap: 1 }}
                >
                  <LogoutOutlinedIcon fontSize="small" />
                  <Typography fontSize={'0.75rem'} fontWeight={500}>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
      <Statistics />
   {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_VIEW]) &&  <Members /> }  
    </>
  );
};
