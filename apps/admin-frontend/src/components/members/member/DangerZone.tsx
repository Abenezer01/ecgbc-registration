import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import KeyboardArrowDownSharpIcon from "@mui/icons-material/KeyboardArrowDownSharp";
import { useState } from "react";
import { Transition } from "../../shared/ModalTransition";
import InactiveMember from "./InactiveMember";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import {
  activeMember,
  inactiveMember,
} from "../../../store/features/member.slice";
import ActiveMember from "./ActiveMember";
import theme from "../../../theme";
import { CommonObjectState } from "../../../enums/common-object-state.enum";
// permission utils
import { userHasPermission } from "../../../utils/hasPermission.util";
import { Permissions } from "../../../enums/permission.enum";

const DangerZone = () => {
  const [openInactiveModal, setInactiveOpenModal] = useState<boolean>(false);
  const [openActiveModal, setActiveOpenModal] = useState<boolean>(false);
  const { member } = useAppSelector((state) => state.member);
  const { staff } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const canDeactivate = userHasPermission(
    staff?.role?.permissions ?? [],
    [Permissions.MEMBER_DEACTIVATE]
  );

  // If the user cannot deactivate/restore, hide the entire Danger Zone
  if (!canDeactivate) return null;

  const handleModalClose = () => {
    setActiveOpenModal(false);
    setInactiveOpenModal(false);
  };

  const onConfirmInactive = (reason: string) => {
    console.log(`reason: ${reason}`);

    if (member)
      dispatch(
        inactiveMember({ id: member.id, reason, closeModal: handleModalClose })
      );
  };
  const onConfirmActive = () => {
    if (member)
      dispatch(activeMember({ id: member.id, closeModal: handleModalClose }));
  };
  const memberStateValue = member?.state?.value ?? (member?.isActive ? CommonObjectState.ACTIVE : CommonObjectState.IN_ACTIVE);
  const memberIsActive = memberStateValue === CommonObjectState.ACTIVE;
  return (
    <Box
      sx={{
        backgroundColor: "#F8F9FA",
        px: 2,
        py: 0,
        borderRadius: 1,
      }}
    >
      {/* <Stack direction={'row'} width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
              <Typography color='#FF1607' my={2} fontFamily={'Montserrat'} fontWeight={'500'} fontSize={'1rem'} >Danger Zone</Typography>
              <IconButton>
                <KeyboardArrowDownSharpIcon />
              </IconButton>
              
            </Stack> */}
      <Accordion sx={{ background: "none", boxShadow: "none" }}>
        <AccordionSummary
          expandIcon={<KeyboardArrowDownSharpIcon />}
          id="danger-zone"
          sx={{
            "& .Mui-expanded": {
              minHeight: "fit-content !important",
            },
          }}
        >
          <Typography
            color="#FF1607"
            fontFamily={"Montserrat"}
            fontWeight={"500"}
            fontSize={"1rem"}
          >
            Danger Zone
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ mb: 2, mt: -1 }} />
          <Stack
            direction={"row"}
            width={"100%"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Typography
              fontFamily={"Montserrat"}
              color="#1E1E1E"
              fontWeight={"500"}
              fontSize={"0.9rem"}
              letterSpacing={0}
            >
              {memberIsActive
                ? "Inactive this institution"
                : "Active this institution"}
            </Typography>
            <Button
              sx={{
                fontFamily: "Inter",
                textTransform: "none",
                color: memberIsActive ? "#FF1607" : theme.palette.primary.main,
                bgcolor: memberIsActive ? "#FFE8E7" : "#1178ca1f",
                fontWeight: "600",
                px: 2,
              }}
              onClick={() => {
                if (memberIsActive) {
                  setInactiveOpenModal(true);
                } else {
                  setActiveOpenModal(true);
                }
              }}
            >
              {memberIsActive ? "Inactive" : "Active"}
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Dialog
        open={openActiveModal || openInactiveModal}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        keepMounted
      >
        {openInactiveModal && (
          <InactiveMember
            handleModalClose={handleModalClose}
            onConfirm={onConfirmInactive}
          />
        )}
        {openActiveModal && (
          <ActiveMember
            handleModalClose={handleModalClose}
            onConfirm={onConfirmActive}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default DangerZone;
