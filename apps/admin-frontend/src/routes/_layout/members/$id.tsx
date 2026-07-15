import {
  Box,
  Button,
  Dialog,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import MemberDetail, { MemberStatusBanner } from "../../../components/members/member/MemberDetail";
import MemberReports from "../../../components/members/member/MemberReports";
import MemberFiles from "../../../components/members/member/MemberFiles";
import DangerZone from "../../../components/members/member/DangerZone";
import { fetchMember } from "../../../store/features/member.slice";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import { Transition } from "../../../components/shared/ModalTransition";
import EditMember from "../../../components/members/EditMember";
import MemberFilesFromSelamMinster from "../../../components/members/member/MemberFilesFromSeleamMinster";
import { userHasPermission } from "../../../utils/hasPermission.util";
import { Permissions } from "../../../enums/permission.enum";

export const Route = createFileRoute("/_layout/members/$id")({
  component: () => <Page />,
});
const Page = () => {
  const { id } = Route.useParams();
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const { staff } = useAppSelector((state) => state.auth);
  const { status, task, member, error } = useAppSelector((state) => state.member);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (id) {
      dispatch(fetchMember(id));
    }
  }, [id, dispatch]);
  const handleModalClose = () => {
    setOpenEdit(false);
    if (id) {
      dispatch(fetchMember(id));
    }
  };
  const loading = status === "loading" && task === "fetch-member";
  return (
    <>
      <Box sx={{ px: { xs: 3, md: 8 }, py: 4, minHeight: '100vh', background: 'linear-gradient(135deg,#f0f6ff 0%,#eef3f8 40%,#f8fafc 100%)' }}>
        <Box
          sx={{
            position: 'relative',
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(110deg,rgba(37,99,235,.92) 0%, rgba(59,130,246,.85) 45%, rgba(29,78,216,.9) 100%)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 8px 28px -6px rgba(29,78,216,0.35)',
            overflow: 'hidden',
            p: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <KeyboardBackspaceIcon sx={{ color: 'rgba(255,255,255,0.85)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '.75rem', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Back</Typography>
            </Link>
            {member && (
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: { xs: '1.15rem', md: '1.5rem' },
                  lineHeight: 1.15,
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: '60vw', md: '50vw' }
                }}
              >
                {member.name}
              </Typography>
            )}
          </Box>
          {member && userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE]) && (
            <Button
              onClick={() => setOpenEdit(true)}
              startIcon={<ModeEditOutlineIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '.8rem',
                px: 2.5,
                py: 1,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                '&:hover': { background: 'rgba(255,255,255,0.28)' }
              }}
            >
              Edit Member
            </Button>
          )}
        </Box>
        {loading ? (
          <Box my={4}><LinearProgress /></Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Member
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => dispatch(fetchMember(id))}
            >
              Try Again
            </Button>
          </Box>
        ) : member && (
          <>
            <MemberStatusBanner member={member} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '65% 35%' }, alignItems: 'start', gap: 4 }}>
              <Stack gap={3} minWidth={0}>
                {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_VIEW,Permissions.FILE_VIEW]) && <MemberDetail member={member} />}    
                {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_VIEW,Permissions.REPORT_VIEW]) && <MemberReports memberId={member.id} memberCertificateIssuedDate={member.certificateIssuedDate} />}
              </Stack>
              <Stack gap={3} position={'sticky'} top={88}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ borderRadius: 3, background: '#ffffff', p: 2.5, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                    <MemberFiles memberId={member.id} />
                  </Box>
                  <Box sx={{ borderRadius: 3, background: '#ffffff', p: 2.5, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                    <MemberFilesFromSelamMinster memberId={member.id} />
                  </Box>
                </Box>
                {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_DEACTIVATE]) && (
                  <Box sx={{ borderRadius: 3, background: '#fff', p: 2.5, boxShadow: '0 4px 18px rgba(255,0,0,0.12)', border: '1px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Stack direction='row' gap={1} alignItems='center'>
                      <Typography fontSize={'.85rem'} fontWeight={600} color={'#dc2626'}>⚠️ Danger Zone</Typography>
                    </Stack>
                    <DangerZone />
                  </Box>
                )}
              </Stack>
            </Box>
          </>
        )}
      </Box>
      <Dialog
        open={openEdit}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        keepMounted
        sx={{
          "& .MuiDialog-container": {
            "& .MuiPaper-root": {
              scrollbarWidth: "thin",
              overflowX: "clip",
            },
          },
        }}
        maxWidth={"lg"}
      >
        {openEdit && member && (
          <EditMember handleModalClose={handleModalClose} member={member} />
        )}
      </Dialog>
    </>
  );
};
