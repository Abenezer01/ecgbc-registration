import { Box, Button, Dialog, Stack, Typography, LinearProgress, Grid } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { fetchFellowship } from "../../../store/features/fellowship.slice";
import CouncilFellowshipDetail, { FellowshipStatusBanner } from "../../../components/councilFellowship/CouncilFellowshipDetail";
import FellowshipReports from "../../../components/councilFellowship/FellowshipReports";
import FellowshipFiles from "../../../components/councilFellowship/FellowshipFiles";
import EditFellowship from "../../../components/councilFellowship/EditFellowship";
import { Transition } from "../../../components/shared/ModalTransition";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { Permissions } from "../../../enums/permission.enum";
import { userHasPermission } from "../../../utils/hasPermission.util";

export const Route = createFileRoute("/_layout/council-fellowship/$id")({
  component: () => <Page />,
});

const Page = () => {
  const { id } = Route.useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { fellowship, status, task } = useAppSelector((state) => state.fellowship);
  const { staff } = useAppSelector((state) => state.auth);
  
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchFellowship(id));
    }
  }, [id, dispatch]);

  const handleModalClose = () => {
    setOpenEdit(false);
    if (id) dispatch(fetchFellowship(id)); // Refresh after edit
  };

  const loading = status === "loading" && task === "fetch-fellowship";

  if (loading) return <LinearProgress />;
  if (!fellowship && !loading) return <Box p={4}>Fellowship not found</Box>;

  return (
    <Box sx={{ px: { xs: 3, md: 8 }, py: 4, minHeight: '100vh', bgcolor: "#f5f7fa" }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
         <Button
            startIcon={<KeyboardBackspaceIcon />}
            onClick={() => navigate({ to: '/council-fellowship' })}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Back to List
          </Button>
      </Stack>

      {fellowship && <FellowshipStatusBanner fellowship={fellowship} />}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {fellowship?.name}
        </Typography>
        {userHasPermission(staff?.role?.permissions??[], [Permissions.COUNCIL_FELLOWSHIP_CHANGE]) && (
          <Button
            variant="contained"
            startIcon={<ModeEditOutlineIcon />}
            onClick={() => setOpenEdit(true)}
            sx={{ textTransform: "none" }}
          >
            Edit Fellowship
          </Button>
        )}
      </Stack>

      <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
              <Stack gap={4}>
                {fellowship && <CouncilFellowshipDetail fellowship={fellowship} />}
                {fellowship && userHasPermission(staff?.role?.permissions??[], [Permissions.REPORT_VIEW]) && (
                    <FellowshipReports
                      fellowshipId={fellowship.id}
                      fellowshipCertificateIssuedDate={fellowship.certificateIssuedDate?.toString() || ""}
                    />
                )}
              </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
              {fellowship && <FellowshipFiles fellowshipId={fellowship.id} />}
          </Grid>
      </Grid>

      <Dialog
        open={openEdit}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="lg"
      >
        {fellowship && (
          <EditFellowship fellowship={fellowship} handleModalClose={handleModalClose} />
        )}
      </Dialog>
    </Box>
  );
};

export default Page;
