import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import theme from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  createFellowship,
  fetchFellowships,
} from "../../store/features/fellowship.slice";
import { fetchDataLookups } from "../../store/features/data-lookup.slice";
import { NewCouncilFellowship } from "../../types/model/fellowship.model";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { MuiTelInput } from "mui-tel-input";
import { NewBoardMember } from "../../types/model/member.model";
import { generateRandomId } from "../../utils/random-id.util";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import EtDatePicker from "habesha-datepicker";
import { toast } from "sonner";
import { formatFileSize } from "../../utils/format-file-size.util";
import { VisuallyHiddenInput } from "../shared/ImageInput";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const MAX_FILES = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

interface CreateFellowshipProps {
  closeCreateFellowship: () => void;
}
const CreateFellowship: React.FC<CreateFellowshipProps> = ({
  closeCreateFellowship,
}) => {
  const [value, setValue] = useState<NewCouncilFellowship>({
    name: "",
    certificateNo: "",
    isInEthiopia: true,
    certificateIssuedDate: null,
    country: "",
    region: "",
    city: "",
    subcity: "",
    zone: "",
    district: "",
    houseNumber: "",
    phoneNumber: "",
    poBoxNumber: "",
    email: "",
    boardMembers: [],
  });
  const [error, setError] = useState({
    phoneNumber: "",
    boardPhoneNumber: "",
  });
  const [boardMember, setBoardMember] = useState<{
    fullName: string;
    phoneNumber: string;
  }>({ fullName: "", phoneNumber: "" });
  const [editedBoardMember, setEditedBoardMember] =
    useState<NewBoardMember | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const lookupStore = useAppSelector((state) => state.lookup);
  const { status, task } = useAppSelector((state) => state.fellowship);
  const dispatch = useAppDispatch();  useEffect(() => {
    dispatch(fetchFellowships({ limit: 50 }));
    dispatch(fetchDataLookups({}));
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const certNo = value.certificateNo.trim();
    if (!certNo) {
      toast.error("Certificate number is required.");
      return;
    }
    if (!/^\d+$/.test(certNo)) {
      toast.error("Certificate number must contain digits only.");
      return;
    }

    if (files.length === 0) {
      // Optional: enforce files if needed, otherwise just proceed
      // setFileError("Please upload at least one file.");
      // return; 
    }

    const finalValue = { ...value, certificateNo: certNo };

    console.log(finalValue);
    dispatch(
      createFellowship({
        newFellowship: finalValue,
        files,
        closeModal: closeCreateFellowship,
      })
    );
  };
  
  // File handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      processFiles(newFiles);
    }
    // Reset file input
    event.target.value = "";
  };

  const processFiles = (newFiles: File[]) => {
    setFileError(null);

    // Filter duplicates
    const uniqueFiles = newFiles.filter(
      (newFile) => !files.some((existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );

    if (uniqueFiles.length < newFiles.length) {
      toast.warning("Duplicate files were skipped.");
    }

    const updatedFiles = [...files, ...uniqueFiles];

    // Check max files count
    if (updatedFiles.length > MAX_FILES) {
      setFileError(`You can verify up to ${MAX_FILES} files.`);
      return;
    }

    // Check total size
    const totalSize = updatedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setFileError(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }

    setFiles(updatedFiles);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };
  
  const clearAllFiles = () => {
    setFiles([]);
    setFileError(null);
  };
  
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);

  const regionOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "region"
  );
  const loading = status === "loading" && task === "create-fellowship";
  return (
    <Box sx={{ mt: 1 }}>
      {/* Gradient header band for cohesion */}
      <Box
        sx={{
          height: 6,
          width: "100%",
          borderRadius: 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          mb: 2,
        }}
      />

      <Typography fontWeight={700} fontSize="1.1rem" fontFamily="Montserrat">
        New Council Fellowship Registration Form
      </Typography>

      <Box
        component={"form"}
        onSubmit={handleSubmit}
        sx={{ my: 1, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Section: Basic Info */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Basic Info
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                  የተቋሙ ስም
                </FormLabel>
                <TextField
                  variant="outlined"
                  required
                  size="small"
                  value={value.name}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      name: e.target.value,
                    })
                  }
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                  የሰርቲፊኬት ቁጥር
                </FormLabel>
                <TextField
                  variant="outlined"
                  required
                  size="small"
                  type="text"
                  placeholder="e.g., 01410"
                  onWheel={(e) => e.currentTarget.blur()}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 }}
                  value={value.certificateNo}
                  onChange={(e) => {
                    setValue({
                      ...value,
                      certificateNo: e.target.value,
                    });
                  }}
                  onBlur={() => {
                    setValue((prev) => ({
                      ...prev,
                      certificateNo: prev.certificateNo.trim(),
                    }));
                  }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                  ሰርተፊኬት የወሰዱበት ቀን
                </FormLabel>
                {/* keep existing date picker logic */}
                <EtDatePicker
                  value={value.certificateIssuedDate}
                  onChange={(date) => setValue({ ...value, certificateIssuedDate: date as Date | null })}
                  size="small"
                  required
                />
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
            <Stack gap={1} sx={{ mb: 1 }}>
              {value.boardMembers.map((bm, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1, borderRadius: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
                    <Typography fontWeight={600}>{bm.fullName}</Typography>
                    <Typography color="text.secondary">{bm.phoneNumber}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditedBoardMember(bm);
                        setBoardMember(bm);
                      }}
                    >
                      <ModeEditOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="የቦርድ አባል ስም"
                  size="small"
                  placeholder="Enter Full Name"
                  value={boardMember.fullName}
                  onChange={(e) =>
                    setBoardMember({
                      ...boardMember,
                      fullName: e.target.value,
                    })
                  }
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <MuiTelInput
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
              </FormControl>
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
                        boardMembers: value.boardMembers.map((bm) => {
                          if (bm.id === editedBoardMember.id) {
                            return { id, ...boardMember };
                          }
                          return bm;
                        }),
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
                      setValue({
                        ...value,
                        boardMembers: [...value.boardMembers, { id, ...boardMember }],
                      });
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
              አድራሻ & Contact
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem", whiteSpace: "nowrap" }}>
                  ተቋሙ አገልግሎት እየሰጠ ያለበት ክልል ውይም የከተማ አስተዳደር
                </FormLabel>
                <Select
                  size="small"
                  required
                  value={value.region}
                  onChange={(e) => setValue({ ...value, region: e.target.value })}
                >
                  {regionOptions.map((region) => (
                    <MenuItem key={region.id} value={region.id}>
                      {region.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
                  Contact person phone number
                </FormLabel>
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
                  placeholder="Enter email"
                  value={value.email}
                  onChange={(e) => setValue({ ...value, email: e.target.value })}
                />
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Files */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Files
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          {fileError && <Alert severity="error" sx={{ mb: 2 }}>{fileError}</Alert>}

          <Box
            component="div" // Changed from label for better drop zone handling
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

          {files.length > 0 && (
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
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Register"
            )}
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
            onClick={() => closeCreateFellowship()}
          >
            <Link to={`.`}>Cancel</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateFellowship;
