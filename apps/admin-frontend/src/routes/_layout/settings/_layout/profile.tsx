import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { imageUrl } from "../../../../utils/image-url.util";
import theme from "../../../../theme";
import { useEffect, useState } from "react";
import { NewStaff } from "../../../../types/model/staff.model";
import { VisuallyHiddenInput } from "../../../../components/shared/ImageInput";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import { updateProfile } from "../../../../store/features/auth.slice";
import { ProfileDetailLoading } from "../../../../components/shared/Loaders";
import { MuiTelInput } from "mui-tel-input";
import { isPossiblePhoneNumber } from "react-phone-number-input";

export const Route = createFileRoute("/_layout/settings/_layout/profile")({
  component: () => <Profile />,
});

const Profile = () => {
  const { staff, status, task } = useAppSelector((state) => state.auth);

  const [value, setValue] = useState<NewStaff>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    avatar: "",
  });
  const [error, setError] = useState({
    phoneNumber: "",
  });
  const [preview, setPreview] = useState<string | null>(
    value.avatar && typeof value.avatar !== "string"
      ? URL.createObjectURL(value.avatar)
      : null
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (staff) {
      setValue((prev) => ({
        ...prev,
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phoneNumber: staff.phoneNumber || "",
        avatar: staff.avatar || "",
      }));
    }
  }, [staff]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const filePreview = URL.createObjectURL(file);
      setPreview(filePreview);
      if (staff)
        dispatch(
          updateProfile({
            id: staff.id,
            updatedStaff: { ...value, avatar: file },
          })
        );
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (staff) {
      if (isPossiblePhoneNumber(value.phoneNumber)) {
        dispatch(updateProfile({ id: staff.id, updatedStaff: value }));
      } else {
        setError({ phoneNumber: "Invalid phone number" });
      }
    }
  };

  const updateLoading = status === "loading" && task === "update-profile";
  const loading = status === "loading" && task === "fetch-authenticated-staf";

  return (
    <Box sx={{ minHeight: "100%", bgcolor: theme.palette.background.default }}>
      {/* Header section (align with Settings container, no extra px) */}
      <Box sx={{ width: "100%", pt: { xs: 6, md: 8 }, pb: 3 }}>
        <Stack alignItems="center" spacing={1.5}>
          {/* Avatar with camera overlay */}
          <Box sx={{ position: "relative", width: 112, height: 112 }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: "50%",
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${theme.palette.divider}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                overflow: "hidden",
                backgroundColor: theme.palette.background.paper,
              }}
            >
              {preview ? (
                <Box
                  component={"img"}
                  src={preview}
                  alt="Profile preview"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : staff?.avatar ? (
                <Box
                  component={"img"}
                  src={imageUrl("avatar", staff.avatar)}
                  alt={`${staff.fullName}'s avatar`}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <AccountCircleIcon sx={{ fontSize: 72, color: theme.palette.grey[400] }} />
              )}

              <IconButton
                component="label"
                aria-label="Upload profile picture"
                size="small"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: `1px solid rgba(255,255,255,0.4)`,
                  backdropFilter: "blur(4px)",
                  width: 36,
                  height: 36,
                  '&:hover': { bgcolor: "rgba(0,0,0,0.7)" },
                }}
              >
                <CameraAltRoundedIcon sx={{ fontSize: 18 }} />
                <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*,.jpg,.png" />
              </IconButton>
            </Box>
          </Box>

          <Typography component={"h1"} variant="h5" sx={{ fontWeight: theme.typography.fontWeightBold, textAlign: "center" }}>
            {staff?.fullName}
          </Typography>
          <Typography component={"p"} variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {staff?.role.name}
          </Typography>
        </Stack>
      </Box>

      {/* Profile form card (uses parent px) */}
      <Box sx={{ width: "100%", mt: 2, mb: 6 }}>
        <Paper elevation={6} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: "100%" }}>
          {loading ? (
            <ProfileDetailLoading />
          ) : (
            <Box component={"form"} onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>First Name</FormLabel>
                    <TextField
                      variant="outlined"
                      size="medium"
                      placeholder="Enter First Name"
                      value={value.firstName}
                      onChange={(e) => setValue({ ...value, firstName: e.target.value })}
                      required
                      disabled={updateLoading}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>Last Name</FormLabel>
                    <TextField
                      variant="outlined"
                      size="medium"
                      placeholder="Enter Last Name"
                      value={value.lastName}
                      onChange={(e) => setValue({ ...value, lastName: e.target.value })}
                      required
                      disabled={updateLoading}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>Phone</FormLabel>
                    <MuiTelInput
                      defaultCountry="ET"
                      value={value.phoneNumber}
                      onChange={(phone) => {
                        setValue({ ...value, phoneNumber: phone });
                        if (!isPossiblePhoneNumber(phone)) {
                          setError({ phoneNumber: "Invalid phone number" });
                        } else {
                          setError({ phoneNumber: "" });
                        }
                      }}
                      size="small"
                      error={!!error.phoneNumber}
                      helperText={error.phoneNumber}
                      disabled={updateLoading}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>Email</FormLabel>
                    <TextField
                      type="email"
                      variant="outlined"
                      size="medium"
                      placeholder="Enter Email"
                      value={value.email}
                      onChange={(e) => setValue({ ...value, email: e.target.value })}
                      required
                      disabled={updateLoading}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end" gap={2} mt={3}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    color: "white",
                    fontWeight: theme.typography.fontWeightBold,
                    py: 1.25,
                    borderRadius: 2,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <CircularProgress size={22} sx={{ color: "white" }} />
                  ) : (
                    "Update"
                  )}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
