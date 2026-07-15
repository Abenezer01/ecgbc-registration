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
  Autocomplete,
  Switch,
  SwitchProps,
  FormControlLabel,
  styled,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import theme from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  fetchFellowships,
  updateFellowship,
} from "../../store/features/fellowship.slice";
import { fetchDataLookups } from "../../store/features/data-lookup.slice";
import { CouncilFellowship, NewCouncilFellowship } from "../../types/model/fellowship.model";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { MuiTelInput } from "mui-tel-input";
import { NewBoardMember } from "../../types/model/member.model";
import { generateRandomId } from "../../utils/random-id.util";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"; // Import delete icon
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import EtDatePicker from "habesha-datepicker";
import FellowshipReports from "./FellowshipReports";
import { toast } from "sonner";
import { countries } from "../../data/countries";


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
        backgroundColor: "#65C466",
        opacity: 1,
        border: 0,
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
      color: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[600],
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 15,
    height: 15,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === "light" ? "#E9E9EA" : "#39393D",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));

interface EditFellowshipProps {
  fellowship: CouncilFellowship;
  handleModalClose: () => void;
}
const EditFellowship: React.FC<EditFellowshipProps> = ({
  fellowship,handleModalClose
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
  const [error,setError ] = useState({
    phoneNumber:'',
    boardPhoneNumber:''
  })
  const [boardMember, setBoardMember] = useState<{
    fullName: string;
    phoneNumber: string;
  }>({ fullName: "", phoneNumber: "" });
  const [editedBoardMember, setEditedBoardMember] = useState<NewBoardMember | null>(null);

  useEffect(() => {
    if (fellowship) {
      
      setValue({
        name: fellowship.name || "",
        certificateNo: fellowship.certificateNo || "",
        isInEthiopia: fellowship.isInEthiopia ?? true,
        certificateIssuedDate: fellowship.certificateIssuedDate
          ? new Date(fellowship.certificateIssuedDate)
          : null,
        country: fellowship.country || "",
        // If region is object, use id. If string, use string
        region: typeof fellowship.region === "object" && fellowship.region !== null 
                ? (fellowship.region as any).id || "" 
                : (fellowship.region as string) || "",
        city: fellowship.city || "",
        subcity: fellowship.subcity || "",
        zone: fellowship.zone || "",
        district: fellowship.district || "",
        houseNumber: fellowship.houseNumber || "",
        poBoxNumber: fellowship.poBoxNumber || "",
        phoneNumber: fellowship.phoneNumber || "",
        email: fellowship.email || "",
        boardMembers:
          fellowship.boardMembers.length > 0
            ? fellowship.boardMembers.map((member) => ({
                id: member.id,
                fullName: member.fullName,
                phoneNumber: member.phoneNumber,
              }))
            : [],
      });
    }
  }, [fellowship]);
  const lookupStore = useAppSelector((state) => state.lookup);
  const { status, task } = useAppSelector((state) => state.fellowship);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchFellowships({limit:50}));
    dispatch(fetchDataLookups({}));
  }, []);

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

    const finalValue = { ...value, certificateNo: certNo };
    console.log(finalValue);
    dispatch(
      updateFellowship({
        id: fellowship.id,
        updatedFellowship: finalValue,
        // files: files, // TODO: Update slice to accept files if needed
        closeModal: handleModalClose,
      })
    );
  };

  const regionOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "region"
  );
  const loading = status === "loading" && task === "create-fellowship";
  return (
    <Box sx={{ p: 2, width: "100%", maxWidth: 1100 }}>
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

      <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" sx={{ mb: 1 }}>
        Update Council Fellowship
      </Typography>

      <Box component={"form"} onSubmit={handleSubmit} sx={{ my: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Section: Fellowship Details */}
        <Paper className="modern-card-hover" elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography fontWeight={700} fontSize="1rem" fontFamily="Montserrat" whiteSpace="nowrap">
              Fellowship Details
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
                  onWheel={(e) => e.currentTarget.blur()}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 }}
                  value={value.certificateNo}
                  onChange={(e) => {
                    setValue({ ...value, certificateNo: e.target.value });
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
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>ሰርተፊኬት የወሰዱበት ቀን</FormLabel>
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
              {value.boardMembers.map((boardMember, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{ p: 1, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>{boardMember.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{boardMember.phoneNumber}</Typography>
                  </Stack>
                  <IconButton onClick={() => { setEditedBoardMember(boardMember); setBoardMember(boardMember); }} size="small">
                    <ModeEditOutlineIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                        setValue((prev) => ({
                            ...prev,
                            boardMembers: prev.boardMembers.filter((_, i) => i !== index),
                        }));
                        // If we are deleting the member currently being edited, reset the edit form
                        if (editedBoardMember?.id === boardMember.id) {
                            setEditedBoardMember(null);
                            setBoardMember({ fullName: "", phoneNumber: "" });
                        }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
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
                  if(!isPossiblePhoneNumber(phone)){
                    setError({ ...error, boardPhoneNumber: 'Invalid phone number' });
                  } else {
                    setError({ ...error, boardPhoneNumber: '' });
                  }
                }}
                size="small"
                error={error.boardPhoneNumber ? true : false}
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
                    if (boardMember.fullName  && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                      const id = generateRandomId();
                      setValue({
                        ...value,
                        boardMembers: value.boardMembers.map((bm) => (bm.id === editedBoardMember.id ? { id, ...boardMember } : bm)),
                      });
                      setBoardMember({ fullName: "", phoneNumber: "" });
                      setEditedBoardMember(null);
                    } else {
                      toast.error("Please enter valid board member details.");
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
                    if (boardMember.fullName  && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                      const id = generateRandomId();
                      setValue({ ...value, boardMembers: [...value.boardMembers, { id, ...boardMember }] });
                      setBoardMember({ fullName: "", phoneNumber: "" });
                    } else {
                      toast.error("Please enter valid board member details.");
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
            <FormControlLabel
                control={
                  <IOSSwitch
                    sx={{ m: 1 }}
                    checked={value.isInEthiopia}
                    onChange={(e) => {
                      setValue({ ...value, isInEthiopia: e.target.checked });
                    }}
                  />
                }
                label="In Ethiopia"
              />
          </Stack>

          <Grid container spacing={2}>
            {value.isInEthiopia ? (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>
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
            ) : (
                 <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "black", mb: 0.5, fontSize: "1rem" }}>Country</FormLabel>
                     <Autocomplete
                        options={countries}
                        autoHighlight
                        getOptionLabel={(option) => option}
                        value={value.country || null}
                        onChange={(_, newValue) => {
                          setValue({ ...value, country: newValue || "" });
                        }}
                        renderInput={(params) => (
                            <TextField
                            {...params}
                            placeholder="Select a country"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: "new-password", // disable autocomplete and autofill
                            }}
                            />
                        )}
                    />
                  </FormControl>
                </Grid>
            )}

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
                    if(!isPossiblePhoneNumber(phone)){
                      setError({ ...error, phoneNumber: 'Invalid phone number' });
                    } else {
                      setError({ ...error, phoneNumber: '' });
                    }
                  }}
                  size="small"
                  error={error.phoneNumber ? true : false}
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

        {/* Section: Reports */}
        <FellowshipReports fellowshipId={fellowship.id} fellowshipCertificateIssuedDate={fellowship.certificateIssuedDate?.toString() || ""} />

        {/* Actions */}
        <Box sx={{ display: "flex", flexDirection: "row", pt: 1, gap: 2 }}>
          <Button
            disabled={loading}
            type="submit"
            variant="contained"
            sx={{ textTransform: "none", color: "white", fontWeight: "bold", px: 6 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Update"}
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
            onClick={() => handleModalClose()}
          >
            <Link to={`.`}>Cancel</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EditFellowship;
