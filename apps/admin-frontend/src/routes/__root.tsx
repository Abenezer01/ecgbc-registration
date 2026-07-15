import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import setAuthToken from "../api/auth";
import { useAppDispatch } from "../store/store";
import { useEffect } from "react";
import { fetchAuthenticatedStaff } from "../store/features/auth.slice";
import { Box, Typography } from "@mui/material";

// Export as rootRoute
export const Route = createRootRoute({
  component: () => <RootComponent />,
  notFoundComponent: () => <NotFoundComponent />,
});

const NotFoundComponent = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4">404 - Page Not Found</Typography>
      <Typography variant="body1">
        The page you're looking for doesn't exist.
      </Typography>
    </Box>
  );
};

const RootComponent = () => {
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchAuthenticatedStaff());
  }, []);
  return (
    <Box sx={{ minWidth: "876px" }}>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </Box>
  );
};

// Add this export
export const rootRoute = Route;