import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  styled,
  Switch,
  SwitchProps,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import theme from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchFellowships } from "../../store/features/fellowship.slice";
import { NewBoardMember, NewMember } from "../../types/model/member.model";
import { fetchDataLookups } from "../../store/features/data-lookup.slice";
import { createMember } from "../../store/features/member.slice";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import { generateRandomId } from "../../utils/random-id.util";
import { MuiTelInput } from "mui-tel-input";
import { countries } from "../../data/countries";
import { CommonObjectState } from "../../enums/common-object-state.enum";
import { RoleType } from "../../enums/role-type.enum";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { validateEmail } from "../../utils/validate-email.util";
import { toast } from "sonner";
import { VisuallyHiddenInput } from "../shared/ImageInput";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { formatFileSize } from "../../utils/format-file-size.util";
import EtDatePicker from "habesha-datepicker";
import api from "../../api/axios";

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 36,
  height: 18,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 1.5,
    marginTop: 0.5,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "#1178D7",
        opacity: 1,
        border: 0,
        ...theme.applyStyles("dark", {
          backgroundColor: "#1178D7",
        }),
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color: theme.palette.grey[100],
      ...theme.applyStyles("dark", {
        color: theme.palette.grey[600],
      }),
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: 0.7,
      ...theme.applyStyles("dark", {
        opacity: 0.3,
      }),
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 16,
    height: 16,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "#E9E9EA",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
    ...theme.applyStyles("dark", {
      backgroundColor: "#39393D",
    }),
  },
}));

const MAX_FILES = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

const AddMember = () => {
  const [value, setValue] = useState<NewMember>({
    name: "",
    certificateNo: "",
    councilFellowshipId: "",
    typeId: "",
    stateId: "",
    isInEthiopia: true,
    certificateIssuedDate: null,
    country: "",
    regionId: "",
    city: "",
    phoneNumber: "",
    email: "",
    isActive: true,
    boardMembers: [],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState({
    phoneNumber: "",
    boardPhoneNumber: "",
    email: "",
  });
  const [boardMember, setBoardMember] = useState<{
    fullName: string;
    phoneNumber: string;
  }>({ fullName: "", phoneNumber: "" });
  const [editedBoardMember, setEditedBoardMember] =
    useState<NewBoardMember | null>(null);

  const fellowShipStore = useAppSelector((state) => state.fellowship);
  const lookupStore = useAppSelector((state) => state.lookup);
  const authStore = useAppSelector((state) => state.auth);
  const { status, task } = useAppSelector((state) => state.member);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchFellowships({ limit: 50 }));
    dispatch(fetchDataLookups({}));
  }, [dispatch]);

  useEffect(() => {
    if (lookupStore.dataLookUps.length > 0) {
      const draftState = lookupStore.dataLookUps.find(
        (lookup) => lookup.value === CommonObjectState.DRAFT
      );
      if (draftState) {
        setValue((prev) => ({ ...prev, stateId: draftState.id }));
      }
    }
  }, [lookupStore.dataLookUps]);

  const staffIsOwner = authStore.staff?.role?.type?.value === RoleType.OWNER;
  const allowedFellowshipIds = authStore.rbac?.allowedFellowshipIds || [];
  const fellowShipOptions = useMemo(
    () => (staffIsOwner
      ? fellowShipStore.fellowships
      : fellowShipStore.fellowships.filter((fellowship) => allowedFellowshipIds.includes(fellowship.id))),
    [staffIsOwner, fellowShipStore.fellowships, allowedFellowshipIds]
  );

  useEffect(() => {
    if (value.councilFellowshipId) return;
    if (fellowShipOptions.length === 1) {
      setValue((prev) => ({ ...prev, councilFellowshipId: fellowShipOptions[0].id }));
    }
  }, [fellowShipOptions, value.councilFellowshipId]);

  const handleCountrySelect = (
    _event: React.SyntheticEvent,
    country: string | null
  ) => {
    setValue((prev) => ({ ...prev, country: country ?? "" }));
  };

  const currentTotalSize = useMemo(
    () => files.reduce((acc, f) => acc + f.size, 0),
    [files]
  );

  const validateAndMergeFiles = useCallback(
    (incoming: File[]) => {
      setFileError(null);
      // Merge while preventing duplicates (by name+size+lastModified)
      const merged = [...files];
      for (const f of incoming) {
        const exists = merged.some(
          (m) => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified
        );
        if (!exists) merged.push(f);
      }
      if (merged.length > MAX_FILES) {
        setFileError(`You can select a maximum of ${MAX_FILES} files.`);
        return;
      }
      const total = merged.reduce((s, f) => s + f.size, 0);
      if (total > MAX_TOTAL_SIZE_BYTES) {
        setFileError(
          `Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB. Current: ${(
            total /
            (1024 * 1024)
          ).toFixed(2)}MB`
        );
        return;
      }
      setFiles(merged);
    },
    [files]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      validateAndMergeFiles(Array.from(selectedFiles));
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles && dtFiles.length > 0) {
      validateAndMergeFiles(Array.from(dtFiles));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setFileError("Please upload at least one file.");
      return;
    }
    
    const certNo = value.certificateNo.trim();

    if (!value.typeId || value.typeId.trim() === "") {
      toast.error("Please select a member type (Church or Ministry).");
      return;
    }
    if (!certNo) {
      toast.error("Certificate number is required.");
      return;
    }
    if (!/^\d+$/.test(certNo)) {
      toast.error("Certificate number must contain digits only.");
      return;
    }

    // Check if certificate number already exists
    try {
      const response = await api.get(`/members/check-certificate/${certNo}`);
      
      if (response.data.data.exists) {
        toast.error(`Certificate number ${certNo} already exists. Please use a different number.`);
        return;
      }
    } catch (error) {
      toast.error("Failed to validate certificate number. Please try again.");
      return;
    }

    const finalValue = { ...value, certificateNo: certNo };

    if (finalValue.phoneNumber) {
      if (isPossiblePhoneNumber(finalValue.phoneNumber)) {
        dispatch(createMember({ newMember: finalValue, files, navigate }));
      }
    } else {
      dispatch(createMember({ newMember: finalValue, files, navigate }));
    }
  };

  const memberTypeOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "member_type"
  );
  const stateOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "object_state"
  );
  const regionOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "region"
  );
  const loading = status === "loading" && task === "create-member";

  return (
    <Box>
      {/* Gradient header band */}
      <Box
        sx={{
          height: 6,
          width: "100%",
          borderRadius: 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          mb: 2,
        }}
      />

      <Typography fontWeight={700} fontSize="1.2rem" fontFamily="Montserrat" sx={{ mb: 1 }}>
        New Member Registration Form
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ my: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Section: Fellowship & Type */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Fellowship & Type
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5 }}>ካውንስል ፌሎሺፕ</FormLabel>
                <Select
                  size="small"
                  required
                  value={value.councilFellowshipId}
                  onChange={(e) => setValue({ ...value, councilFellowshipId: e.target.value })}
                >
                  {fellowShipOptions.length > 0 &&
                    fellowShipOptions.map((fellowship) => (
                      <MenuItem key={fellowship.id} value={fellowship.id}>
                        {fellowship.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5 }}>የውጭ ሃገር ተቋም</FormLabel>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IOSSwitch
                    checked={!value.isInEthiopia}
                    onChange={() => setValue({ ...value, isInEthiopia: !value.isInEthiopia })}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {value.isInEthiopia ? "Ethiopia" : "Outside Ethiopia"}
                  </Typography>
                </Stack>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5 }}>የተቋሙ አይነት</FormLabel>
                <RadioGroup row name="typeId" onChange={(e) => setValue({ ...value, typeId: e.target.value })}>
                  {memberTypeOptions
                    .sort((a, b) => a.index - b.index)
                    .map((memberType) => (
                      <FormControlLabel key={memberType.id} value={memberType.id} control={<Radio size="small" />} label={memberType.description} />
                    ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Organization Details */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Organization Details
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>የተቋሙ ስም</FormLabel>
                <TextField
                  variant="outlined"
                  required
                  size="small"
                  value={value.name}
                  onChange={(e) => setValue({ ...value, name: e.target.value })}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>የሰርቲፊኬት ቁጥር</FormLabel>
                <TextField
                  variant="outlined"
                  required
                  size="small"
                  type="text"
                  placeholder="e.g., 01410"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 }}
                  value={value.certificateNo}
                  onChange={(e) => {
                    setValue({ ...value, certificateNo: e.target.value });
                  }}
                  onBlur={async () => {
                    const certNo = value.certificateNo.trim();
                    // Normalize what the user typed back into state
                    setValue((prev) => ({ ...prev, certificateNo: certNo }));

                    if (!certNo) {
                      return;
                    }

                    if (!/^\d+$/.test(certNo)) {
                      toast.error("Certificate number must contain digits only.");
                      return;
                    }

                    try {
                      const response = await api.get(`/members/check-certificate/${certNo}`);

                      if (response.data.data.exists) {
                        toast.error(`Certificate number ${certNo} already exists. Please use a different number.`);
                      }
                    } catch (error) {
                      // Silently fail for onBlur to avoid annoying users
                    }
                  }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>ሰርተፊኬት የወሰዱበት ቀን</FormLabel>
                <EtDatePicker value={value.certificateIssuedDate ? new Date(value.certificateIssuedDate) : null} onChange={(date) => setValue({ ...value, certificateIssuedDate: date ? (date as Date).toISOString() : null })} size="small" required />
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Board Members */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              የቦርድ አባላት
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          {value.boardMembers.length > 0 && (
            <Stack gap={1} sx={{ mb: 1, ml: 0 }}>
              {value.boardMembers.map((bm, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>{bm.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{bm.phoneNumber}</Typography>
                  </Stack>
                  <IconButton size="small" onClick={() => { setEditedBoardMember(bm); setBoardMember(bm); }}>
                    <ModeEditOutlineIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                variant="outlined"
                label="የቦርድ አባል ስም"
                size="small"
                placeholder="Enter Full Name"
                value={boardMember.fullName}
                onChange={(e) => setBoardMember({ ...boardMember, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <MuiTelInput
                fullWidth
                defaultCountry="ET"
                label="የቦርድ አባል ስልክ"
                placeholder="Enter Phone"
                value={boardMember.phoneNumber}
                onChange={(phone) => {
                  setBoardMember({ ...boardMember, phoneNumber: phone });
                  if (!isPossiblePhoneNumber(phone)) {
                    setError({ ...error, boardPhoneNumber: "Invalid phone number" });
                  } else {
                    setError({ ...error, boardPhoneNumber: "" });
                  }
                }}
                size="small"
                error={!!error.boardPhoneNumber}
                helperText={error.boardPhoneNumber}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              {editedBoardMember ? (
                <Button
                  fullWidth
                  disabled={!(boardMember.fullName || boardMember.phoneNumber)}
                  variant="contained"
                  sx={{ textTransform: "none" }}
                  onClick={() => {
                    if (boardMember.fullName && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                      const id = generateRandomId();
                      setValue({
                        ...value,
                        boardMembers: value.boardMembers.map((bm) => (bm.id === editedBoardMember.id ? { id, ...boardMember } : bm)),
                      });
                      setBoardMember({ fullName: "", phoneNumber: "" });
                      setEditedBoardMember(null);
                    }
                  }}
                >
                  Update
                </Button>
              ) : (
                <Button
                  fullWidth
                  disabled={!(boardMember.fullName || boardMember.phoneNumber)}
                  variant="contained"
                  sx={{ textTransform: "none" }}
                  onClick={() => {
                    if (boardMember.fullName && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                      const id = generateRandomId();
                      setValue({ ...value, boardMembers: [...value.boardMembers, { id, ...boardMember }] });
                      setBoardMember({ fullName: "", phoneNumber: "" });
                    }
                  }}
                >
                  Add
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Address & Contact */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              አድራሻ & ኮንታክት
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={value.isInEthiopia ? 6 : 6}>
              {value.isInEthiopia ? (
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                    ተቋሙ አገልግሎት እየሰጠ ያለበት ክልል ውይም የከተማ አስተዳደር
                  </FormLabel>
                  <Select
                    size="small"
                    required
                    value={value.regionId}
                    onChange={(e) => setValue({ ...value, regionId: e.target.value })}
                  >
                    {regionOptions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                    ተቋሙ አገልግሎት እየሰጠ ያለበት ሀገር
                  </FormLabel>
                  <Autocomplete
                    size="small"
                    disablePortal
                    options={countries}
                    onChange={handleCountrySelect}
                    value={value.country}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </FormControl>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>ከተማ</FormLabel>
                <TextField
                  variant="outlined"
                  required
                  size="small"
                  placeholder="Enter City name"
                  value={value.city}
                  onChange={(e) => setValue({ ...value, city: e.target.value })}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>Contact person phone number</FormLabel>
                <MuiTelInput
                  defaultCountry="ET"
                  value={value.phoneNumber}
                  onChange={(phone) => {
                    setValue({ ...value, phoneNumber: phone });
                    if (!isPossiblePhoneNumber(phone)) {
                      setError({ ...error, phoneNumber: "Invalid phone number" });
                    } else {
                      setError({ ...error, phoneNumber: "" });
                    }
                  }}
                  size="small"
                  error={!!error.phoneNumber}
                  helperText={error.phoneNumber}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>ኢ-ሜይል</FormLabel>
                <TextField
                  variant="outlined"
                  size="small"
                  type="email"
                  placeholder="Enter email"
                  value={value.email}
                  onChange={(e) => {
                    setValue({ ...value, email: e.target.value });
                    setError({ ...error, email: validateEmail(e.target.value) });
                  }}
                  error={!!error.email}
                  helperText={error.email}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "#555", mb: 0.5, fontSize: "0.9rem" }}>State</FormLabel>
                <Select
                  size="small"
                  value={value.stateId}
                  onChange={(e) => setValue({ ...value, stateId: e.target.value })}
                >
                  {stateOptions
                    .filter((state) => state.value !== "object_state_inactive")
                    .map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.description}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Attachments */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Member Files
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          {fileError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {fileError}
            </Alert>
          )}

          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            sx={{
              border: `1px dashed ${fileError ? theme.palette.error.main : theme.palette.primary.main}`,
              borderRadius: 2,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              minHeight: 72,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <CloudUploadIcon color="primary" fontSize="small" />
              <Button component="label" role={undefined} tabIndex={-1} variant="text" sx={{ textTransform: "none", px: 0 }}>
                Click to upload
                <VisuallyHiddenInput type="file" multiple onChange={handleFileChange} accept={ACCEPTED_TYPES} />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                or drag & drop (Max {MAX_FILES}, {MAX_TOTAL_SIZE_MB}MB total)
              </Typography>
            </Stack>

            {files.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="small" onClick={clearAllFiles} color="inherit">
                  Clear all
                </Button>
              </Stack>)
            }
          </Box>

          {files.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {files.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    label={`${file.name} (${formatFileSize(file.size)})`}
                    size="small"
                    onDelete={() => handleRemoveFile(index)}
                    sx={{ maxWidth: "100%" }}
                  />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Total Size: {formatFileSize(currentTotalSize)}
              </Typography>
            </Box>
          ) : (
            !fileError && (
              <Typography fontFamily="Montserrat" fontSize="0.8rem" color="text.secondary" mt={1}>
                No files selected.
              </Typography>
            )
          )}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: "flex", flexDirection: "row", pt: 1, gap: 2 }}>
          <Button
            disabled={loading}
            type="submit"
            variant="contained"
            sx={{ textTransform: "none", color: "white", fontWeight: "bold", px: 6 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Register"}
          </Button>
          <Box
            color="inherit"
            sx={{
              alignSelf: "center",
              "& a": {
                border: `1px solid`,
                mr: 1,
                textDecoration: "none",
                color: "#7B7B7B",
                px: 3,
                borderColor: theme.palette.grey[400],
                p: "7px 20px",
                borderRadius: 1,
                fontFamily: theme.typography.fontFamily,
              },
            }}
          >
            <Link to={`/dashboard`}>Cancel</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AddMember;
