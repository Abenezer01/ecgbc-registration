import React from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useAppSelector } from "../../../store/store";
import theme from "../../../theme";

interface ActiveMemberProps {
  handleModalClose: () => void;
  onConfirm: () => void;
}
const ActiveMember: React.FC<ActiveMemberProps> = ({
  handleModalClose,
  onConfirm,
}) => {
  const { status, task } = useAppSelector((state) => state.member);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm();
  };

  const loading = status === "loading" && task === "update-member";
  return (
    <Box sx={{ p: 2, minWidth: 400, width: "fit-content" }}>
      <Stack
        direction={"row"}
        width={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography fontFamily={"Montserrat"} fontWeight={"500"} color="black">
          Active Institution
        </Typography>
        <IconButton onClick={handleModalClose}>
          <CloseIcon fontSize="small" sx={{ color: "black" }} />
        </IconButton>
      </Stack>
      <Box component={"form"} onSubmit={handleSubmit} mt={1}>
        <FormControl fullWidth>
          <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.7rem" }}>
            Are you sure you want to active this member ?
          </FormLabel>
        </FormControl>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{
            textTransform: "none",
            mt: 2,
            bgcolor: theme.palette.primary.main,
            color: "white",
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Active"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default ActiveMember;
