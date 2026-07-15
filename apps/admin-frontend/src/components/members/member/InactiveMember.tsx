import React, { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAppSelector } from "../../../store/store";

interface InactiveMemberProps {
  handleModalClose: () => void;
  onConfirm: (reason: string) => void;
}
const InactiveMember: React.FC<InactiveMemberProps> = ({
  handleModalClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>("");
  const { status, task } = useAppSelector((state) => state.member);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (reason) onConfirm(reason);
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
          Inactive Institution
        </Typography>
        <IconButton onClick={handleModalClose}>
          <CloseIcon fontSize="small" sx={{ color: "black" }} />
        </IconButton>
      </Stack>
      <Box component={"form"} onSubmit={handleSubmit} mt={1}>
        <FormControl fullWidth>
          <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.7rem" }}>
            please write down the reason of deactivation below:
          </FormLabel>
          {/* <Typography fontWeight={"700"} whiteSpace={"nowrap"} mb={2}>
            I want to deactivate {member?.name}
          </Typography> */}
          <TextField
            variant="outlined"
            size="small"
            placeholder=""
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </FormControl>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{
            textTransform: "none",
            mt: 2,
            bgcolor: "#FF1607",
            color: "white",
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Inactive"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default InactiveMember;
