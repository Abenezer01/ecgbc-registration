import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { NewStaff, Staff } from "../../types/model/staff.model";
import theme from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { VisuallyHiddenInput } from "../shared/ImageInput";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { fetchRoles } from "../../store/features/role.slice";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "sonner";
import { updateStaff } from "../../store/features/staff.slice";
import { canEditState } from "../../utils/permissions.util";
import { MuiTelInput } from "mui-tel-input";
import { isPossiblePhoneNumber } from "react-phone-number-input";

interface EditStaffProps {
  show: boolean;
  staff: Staff;
  closeEditStaff: () => void;
}
const EditStaff: React.FC<EditStaffProps> = ({
  show,
  staff,
  closeEditStaff,
}) => {
  const [value, setValue] = useState<NewStaff>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: "",
    password: "",
    roleId: "",
    stateId: "",
  });
  const [error,setError ] = useState({
    phoneNumber:'',
  })
  const [preview, setPreview] = useState<string | null>(
    value.avatar && typeof value.avatar !== "string"
      ? URL.createObjectURL(value.avatar)
      : null
  );

  const authStore = useAppSelector((state) => state.auth);
  const { status, task } = useAppSelector((state) => state.staff);
  const roleStore = useAppSelector((state) => state.role);
  const lookupStore = useAppSelector((state) => state.lookup);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (staff) {
      setValue({
        ...value,
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phoneNumber: staff.phoneNumber || "",
        avatar: staff.avatar || "",
        roleId: staff.role.id || "",
        stateId: staff.state.id || "",
      });
    }
  }, [staff]);
  useEffect(() => {
    dispatch(fetchRoles({}));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Optional chaining to handle if no file is selected

    if (file) setValue({ ...value, avatar: file });

    // Generate a preview of the selected image
    if (file) {
      const filePreview = URL.createObjectURL(file);
      setPreview(filePreview);
    }
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if( isPossiblePhoneNumber(value.phoneNumber)){
      dispatch(
        updateStaff({ id: staff.id, updatedStaff: value, closeEditStaff })
      );
} else{
  setError({phoneNumber: "Invalid phone number"});
}  
    
  };
  const roleOptions = roleStore.roles;
  const stateOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "object_state"
  );
  const loading = status === "loading" && task === "update-staff";
  return (
    <Box
      sx={{
        display: show ? "block" : "none",
        maxWidth: 700,
        mx: "auto",
        my: 4,
      }}
    >
      <Box component={"form"} onSubmit={handleSubmit}>
        <Stack direction={"row"} width={"100%"} gap={2}>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
              First Name
            </FormLabel>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Enter First Name"
              value={value.firstName}
              onChange={(e) =>
                setValue({
                  ...value,
                  firstName: e.target.value,
                })
              }
              required
            />
          </FormControl>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
              Last name
            </FormLabel>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Enter Last Name"
              value={value.lastName}
              onChange={(e) =>
                setValue({
                  ...value,
                  lastName: e.target.value,
                })
              }
              required
            />
          </FormControl>
        </Stack>
        <Stack direction={"row"} width={"100%"} gap={2} my={1}>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
              Phone
            </FormLabel>
            
            <MuiTelInput
              defaultCountry="ET"
              value={value.phoneNumber}
              onChange={(phone) => {
                setValue({ ...value, phoneNumber: phone });
                if(!isPossiblePhoneNumber(phone)){
                  setError({phoneNumber:'Invalid phone number'})
                }
                else{
                  setError({phoneNumber:''})
                }
              }}
              size="small"
              error={error.phoneNumber ? true : false}
                    helperText={error.phoneNumber}
            />
          </FormControl>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
              Email
            </FormLabel>
            <TextField
              type="email"
              variant="outlined"
              size="small"
              placeholder="Enter Email"
              value={value.email}
              onChange={(e) =>
                setValue({
                  ...value,
                  email: e.target.value,
                })
              }
              required
            />
          </FormControl>
        </Stack>
        <Stack direction={"row"} width={"100%"} gap={2} my={1}>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555", my: 1, fontSize: "0.9rem" }}>
              Role
            </FormLabel>

            <Select
              size="small"
              value={value.roleId}
              onChange={(e) => setValue({ ...value, roleId: e.target.value })}

              // MenuProps={MenuProps}
            >
              {roleOptions.length > 0 &&
                roleOptions.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "555555", my: 1, fontSize: "0.9rem" }}>
              Upload Image
            </FormLabel>
            <Box
              sx={{
                width: "100%",
                //   border: `1px solid ${errors.image?theme.palette.error.main: theme.palette.grey[400]}`,
                border: `1px solid ${theme.palette.grey[400]}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                height: 100,
              }}
            >
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                sx={{
                  textTransform: "none",
                  background: "none",
                  width: "fit-content",
                  boxShadow: "none",
                  color: "black",
                  "&:hover": {
                    background: "none",
                    boxShadow: "none",
                  },
                }}
              >
                Drop or select file
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg, .png"
                />
              </Button>
              {preview && (
                <img
                  src={preview}
                  alt="Selected file"
                  style={{ height: "85px", width: "auto" }}
                />
              )}
            </Box>
          </FormControl>
        </Stack>
        <Stack direction={"row"} width={"100%"} gap={2} my={1}>
          {canEditState(authStore.staff!, staff) && (
            <FormControl sx={{ width: "50%" }}>
              <FormLabel sx={{ color: "#555", my: 1, fontSize: "0.9rem" }}>
                State
              </FormLabel>

              <Select
                size="small"
                value={value.stateId}
                onChange={(e) =>
                  setValue({ ...value, stateId: e.target.value })
                }

                // MenuProps={MenuProps}
              >
                {stateOptions.length > 0 &&
                  stateOptions.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.description}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              Password
            </FormLabel>
            <TextField
              variant="outlined"
              type="text"
              size="small"
              placeholder="Enter password"
              value={value.password}
              onChange={(e) =>
                setValue({
                  ...value,
                  password: e.target.value,
                })
              }
              slotProps={{
                input: {
                  endAdornment: value.password ? (
                    <InputAdornment position="end">
                      <CopyToClipboard
                        text={value.password ? value.password : ""}
                        onCopy={() => toast("Copied to clipboard.")}
                      >
                        <Tooltip title="Click to copy">
                          <Box>
                            <CopyAllIcon sx={{ cursor: "pointer" }} />
                          </Box>
                        </Tooltip>
                      </CopyToClipboard>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </FormControl>
        </Stack>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{
            textTransform: "none",
            color: "white",
            mt: 1,
            fontWeight: theme.typography.fontWeightBold,
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress
              size="small"
              sx={{
                color: "white",
                height: "28px !important",
                width: "28px !important",
              }}
            />
          ) : (
            "Update staff"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default EditStaff;
