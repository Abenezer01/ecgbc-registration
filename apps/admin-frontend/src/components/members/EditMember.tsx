import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
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
import { useEffect, useMemo, useState } from "react";
import theme from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchFellowships } from "../../store/features/fellowship.slice";
import {
  Member,
  NewBoardMember,
  NewMember,
} from "../../types/model/member.model";
import { fetchDataLookups } from "../../store/features/data-lookup.slice";
import { updateMember } from "../../store/features/member.slice";
import { RoleType } from "../../enums/role-type.enum";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"; // Import delete icon
import { generateRandomId } from "../../utils/random-id.util";
import { MuiTelInput } from "mui-tel-input";
import { countries } from "../../data/countries";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import EtDatePicker from "habesha-datepicker";
import { toast } from "sonner"; // added for validation feedback
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
interface EditMemberProps {
  member: Member;
  handleModalClose: () => void;
}
const EditMember: React.FC<EditMemberProps> = ({
  member,
  handleModalClose,
}) => {
  const [value, setValue] = useState<NewMember>({
    name: "",
    certificateNo: "",
    councilFellowshipId: "",
    typeId: "",
    stateId: "",
    isInEthiopia: false,
    certificateIssuedDate: null,
    country: "",
    regionId: "",
    city: "",
    phoneNumber: "",
    email: "",
    isActive: true,
    boardMembers: [],
  });
const [error,setError ] = useState({
  phoneNumber:'',
  boardPhoneNumber:''
})
  useEffect(() => {
    if (member) {
      
      setValue({
        name: member.name || "",
        certificateNo: member.certificateNo || "",
        councilFellowshipId: member.councilFellowshipId || "",
        typeId: member.typeId || "",
        stateId: member.state.id || "",
        isInEthiopia: Boolean(member.isInEthiopia),
        certificateIssuedDate: member.certificateIssuedDate
          ? new Date(member.certificateIssuedDate).toISOString()
          : null,
        country: typeof member.country === 'string' ? member.country : member.country?.value || "",
        regionId: member.regionId || "",
        city: typeof member.city === 'string' ? member.city : member.city?.value || "",
        phoneNumber: member.phoneNumber || "",
        email: member.email || "",
        isActive: member.isActive ?? true,
        boardMembers:
          member.boardMembers.length > 0
            ? member.boardMembers.map((member) => ({
                id: member.id,
                fullName: member.fullName,
                phoneNumber: member.phoneNumber,
              }))
            : [],
      });
    }
  }, [member]);

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
  useEffect(() => {
    dispatch(fetchFellowships({ page: 1, limit: 50 }));
    dispatch(fetchDataLookups({}));
  }, []);
  const handleCountrySelect = (_event: React.ChangeEvent<{}>, country: any) => {
    
    if (country) {
      setValue({...value,country})
    } else {
      setValue({...value,country})
    }
  };
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

    const finalValue = {
      ...value,
      certificateNo: certNo,
    };

    console.log(finalValue);
    dispatch(
      updateMember({
        updatedMember: finalValue,
        id: member.id,
        closeModal: handleModalClose,
      })
    );
  };
  const staffIsOwner = authStore.staff?.role?.type?.value === RoleType.OWNER;
  const allowedFellowshipIds = authStore.rbac?.allowedFellowshipIds || [];
  const fellowShipOptions = useMemo(
    () => (staffIsOwner
      ? fellowShipStore.fellowships
      : fellowShipStore.fellowships.filter((fellowship) => allowedFellowshipIds.includes(fellowship.id))),
    [staffIsOwner, fellowShipStore.fellowships, allowedFellowshipIds]
  );

  useEffect(() => {
    if (!fellowShipOptions.length) return;
    const currentExists = fellowShipOptions.some((fellowship) => fellowship.id === value.councilFellowshipId);
    if (!currentExists) {
      setValue((prev) => ({
        ...prev,
        councilFellowshipId: fellowShipOptions[0]?.id || "",
      }));
    }
  }, [fellowShipOptions, value.councilFellowshipId]);

  const memberTypeOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "member_type"
  );
  // const stateOptions = lookupStore.dataLookUps.filter(
  //   (lookup) => lookup.type === "object_state"
  // );
  const regionOptions = lookupStore.dataLookUps.filter(
    (lookup) => lookup.type === "region"
  );
  const loading = status === "loading" && task === "create-member";
  const fellowshipsLoading =
    fellowShipStore.status === "loading" &&
    fellowShipStore.task === "fetch-fellowships";
  const dataLookupLoading =
    lookupStore.status === "loading" &&
    lookupStore.task === "fetch-data-lookups";
  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Typography
        fontWeight={"700"}
        fontSize={"1.2rem"}
        fontFamily={"Montserrat"}
      >
        Update Member
      </Typography>
      <Divider sx={{ mt: 2 }} />
      <Box
        component={"form"}
        onSubmit={handleSubmit}
        sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Council Fellowship */}
        <FormControl sx={{ width: 200 }}>
          <FormLabel sx={{ color: "black", my: 1 }}>ካውንስል ፌሎሺፕ</FormLabel>

          {!fellowshipsLoading && (
            <Select
              size="small"
              required
              // placeholder="Select fellowship"
              value={value.councilFellowshipId}
              onChange={(e) =>
                setValue({
                  ...value,
                  councilFellowshipId: e.target.value,
                })
              }
              aria-hidden="false"
              // error={errors?.state?true:false}
            >
              {/* <MenuItem value={''}>Select State</MenuItem> */}
              {fellowShipOptions.length > 0 &&
                fellowShipOptions.map((fellowship) => (
                  <MenuItem key={fellowship.id} value={fellowship.id}>
                    {fellowship.name}
                  </MenuItem>
                ))}
            </Select>
          )}

          {/* <Typography component={'p'} variant="body2" color={theme.palette.error.main} px={1.5} fontSize={'0.8rem'}>{errors.state}</Typography> */}
        </FormControl>
        {/* Country */}
        <FormControl
          fullWidth
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormLabel sx={{ color: "black", my: 1 }}>የውጭ ሃገር ተቋም</FormLabel>
          <IOSSwitch
            checked={!value.isInEthiopia}
            onChange={() => {
              setValue({ ...value, isInEthiopia: !value.isInEthiopia });
              // setOpenModal(true);
            }}
          />
        </FormControl>
        {/* Member Type */}
        <Divider sx={{}} />
        <FormControl
          fullWidth
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormLabel sx={{ color: "black", my: 1 }}>የተቋሙ አይነት</FormLabel>
          {!dataLookupLoading && (
            <RadioGroup
              row
              name="typeId"
              onChange={(e) => setValue({ ...value, typeId: e.target.value })}
            >
              {memberTypeOptions.length > 0 &&
                memberTypeOptions.map((memberType) => (
                  <FormControlLabel
                    key={memberType.id}
                    value={memberType.id}
                    control={<Radio />}
                    checked={value.typeId === memberType.id}
                    label={memberType.description}
                  />
                ))}
            </RadioGroup>
          )}
        </FormControl>
        {/* Name and Region*/}
        <Stack direction={"row"} alignItems={"center"} gap={2} width="100%">
          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              የተቋሙ ስም
            </FormLabel>
            <TextField
              variant="outlined"
              required
              size="small"
              //   placeholder="Enter name"
              value={value.name}
              onChange={(e) =>
                setValue({
                  ...value,
                  name: e.target.value,
                })
              }
              // error={errors?.name?true:false}
              // helperText={errors.name}
            />
          </FormControl>

         
        </Stack>
        {/* Certificate number and issued date*/}
        <Stack direction={"row"} alignItems={"center"} gap={2} width="100%">
          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              የሰርቲፊኬት ቁጥር
            </FormLabel>
            <TextField
              variant="outlined"
              required
              size="small"
              type="text"
              placeholder="e.g., 01410"
              value={value.certificateNo}
              onWheel={(e) => e.currentTarget.blur()}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 }}
              onChange={(e) =>
                setValue({
                  ...value,
                  certificateNo: e.target.value,
                })
              }
              onBlur={() => {
                setValue((prev) => ({
                  ...prev,
                  certificateNo: prev.certificateNo.trim(),
                }));
              }}
              // error={errors?.name?true:false}
              // helperText={errors.name}
            />
          </FormControl>

          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              ሰርተፊኬት የወሰዱበት ቀን
            </FormLabel>
            {/* <Box
              component={"input"}
              type="date"
              sx={{
                p: 1,
                borderColor: "#E8E8E8",
                boxShadow: "none",
                color: "#555555",
                my: 1,
              }}
              required
              value={value.certificateIssuedDate}
              onChange={(e) =>
                setValue({
                  ...value,
                  certificateIssuedDate: e.target.value,
                })
              }
            /> */}
             <EtDatePicker
      // label="Select Document Date"
      value={value.certificateIssuedDate ? new Date(value.certificateIssuedDate) : null}
      onChange={(date) => setValue({...value,certificateIssuedDate: date && !Array.isArray(date) ? (date as Date).toISOString() : null})}
      // minDate={new Date("YYYY-MM-DD")}
      // maxDate={new Date("YYYY-MM-DD")}
      size="small"
      />
          </FormControl>
        </Stack>
        {/* Board Members */}
        <Stack direction={"row"} width="100%" alignItems={"center"} gap={2}>
          <Typography
            fontWeight={"700"}
            fontSize={"1rem"}
            fontFamily={"Montserrat"}
            whiteSpace="nowrap"
          >
            የቦርድ አባላት
          </Typography>{" "}
          <Divider sx={{ width: "100%" }} />
        </Stack>
        {value.boardMembers.length > 0 && (
          <Stack gap={1} ml={2}>
            {value.boardMembers.map((boardMember, index) => (
              <Stack
                key={index}
                direction={"row"}
                alignItems={"center"}
                gap={2}
                width="100%"
              >
                <Typography>{boardMember.fullName}</Typography>
                <Typography>{boardMember.phoneNumber}</Typography>
                <IconButton
                  onClick={() => {
                    setEditedBoardMember(boardMember);
                    setBoardMember(boardMember);
                  }}
                >
                  <ModeEditOutlineIcon fontSize="small" />
                </IconButton>
                <IconButton
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
                  color="error" // Optional: makes the delete button red
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}

        <Stack direction={"row"} alignItems={"center"} gap={2} width="100%">
          <FormControl>
            <TextField
              variant="outlined"
              // required
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
              // error={errors?.name?true:false}
              // helperText={errors.name}
            />
          </FormControl>
          <FormControl>
            {/* <TextField
              variant="outlined"
              // required
              label="የቦርድ አባል ስልክ"
              size="small"
              placeholder="Enter Phone"
              value={boardMember.phoneNumber}
              onChange={(e) =>
                setBoardMember({
                  ...boardMember,
                  phoneNumber: e.target.value,
                })
              }
              // error={errors?.name?true:false}
              // helperText={errors.name}
            /> */}
            <MuiTelInput
              defaultCountry="ET"
              label="የቦርድ አባል ስልክ"
              placeholder="Enter Phone"
              value={boardMember.phoneNumber}
              onChange={(phone) =>{
                setBoardMember({
                  ...boardMember,
                  phoneNumber: phone,
                });
                if(!isPossiblePhoneNumber(phone)){
                  setError({...error,boardPhoneNumber:'Invalid phone number'})
                }
                else{
                  setError({...error,boardPhoneNumber:''})
                }
              

              }
              }
              size="small"
              error={error.boardPhoneNumber ? true : false}
              helperText={error.boardPhoneNumber}
            />
          </FormControl>
          {editedBoardMember ? (
            <Button
              disabled={!(boardMember.fullName || boardMember.phoneNumber)}
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={() => {

                if (boardMember.fullName && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                  setValue({
                    ...value,
                    boardMembers: value.boardMembers.map((bm) => {
                      if (bm.id === editedBoardMember.id) {
                        return { id: editedBoardMember.id, ...boardMember };
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
              disabled={!(boardMember.fullName || boardMember.phoneNumber)}
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={() => {
                if (boardMember.fullName && isPossiblePhoneNumber(boardMember.phoneNumber)) {
                  const id = generateRandomId();
                  setValue({
                    ...value,
                    boardMembers: [
                      ...value.boardMembers,
                      { id, ...boardMember },
                    ],
                  });
                  setBoardMember({ fullName: "", phoneNumber: "" });
                }
              }}
            >
              Add
            </Button>
          )}
        </Stack>
        <Stack direction={"row"} width="100%" alignItems={"center"} gap={2}>
          <Typography
            fontWeight={"700"}
            fontSize={"1rem"}
            fontFamily={"Montserrat"}
          >
            አድራሻ
          </Typography>{" "}
          <Divider sx={{ width: "100%" }} />
        </Stack>

           <Stack direction={"row"} alignItems={"center"} gap={2} width="100%">
          {value.isInEthiopia ? (
            <FormControl>
              <FormLabel
                sx={{
                  color: "black",
                  my: 1,
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                }}
              >
                ተቋሙ አገልግሎት እየሰጠ ያለበት ክልል ውይም የከተማ አስተዳደር
              </FormLabel>
              <Select
                size="small"
                required
                // placeholder="Select Region"
                value={value.regionId}
                onChange={(e) =>
                  setValue({
                    ...value,
                    regionId: e.target.value,
                  })
                }
                aria-hidden="false"
                // error={errors?.state?true:false}
              >
                {/* <MenuItem value={''}>Select State</MenuItem> */}
                {regionOptions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.description}
                  </MenuItem>
                ))}
              </Select>
              {/* <Typography component={'p'} variant="body2" color={theme.palette.error.main} px={1.5} fontSize={'0.8rem'}>{errors.state}</Typography> */}
            </FormControl>
          ) : (
            <FormControl>
            <FormLabel
              sx={{
                color: "black",
                my: 1,
                fontSize: "1rem",
                whiteSpace: "nowrap",
              }}
            >
            ተቋሙ አገልግሎት እየሰጠ ያለበት ሀገር
            </FormLabel>
            <Autocomplete
            size="small"
      disablePortal
      options={countries}
      onChange={handleCountrySelect}
      sx={{ width: 300 }}
      value={value.country}
      renderInput={(params) => <TextField  {...params} />}
    />
            </FormControl>
           
          )}
          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              ከተማ
            </FormLabel>
            <TextField
              variant="outlined"
              required
              size="small"
              placeholder="Enter City name"
              value={value.city}
              onChange={(e) =>
                setValue({
                  ...value,
                  city: e.target.value,
                })
              }
              // error={errors?.name?true:false}
              // helperText={errors.name}
            />
          </FormControl>
        </Stack>
        <Stack direction={"row"} alignItems={"center"} gap={2} width="100%">
          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              Contact person phone number
            </FormLabel>
          
            <MuiTelInput
              defaultCountry="ET"
              value={value.phoneNumber}
              onChange={(phone) => {
                setValue({ ...value, phoneNumber: phone })
                if(!isPossiblePhoneNumber(phone)){
                  setError({...error,phoneNumber:'Invalid phone number'})
                }
                else{
                  setError({...error,phoneNumber:''})
                }
              }}
              size="small"
              error={error.phoneNumber ? true : false}
              helperText={error.phoneNumber}
            />
          </FormControl>
          <FormControl>
            <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
              ኢ-ሜይል
            </FormLabel>
            <TextField
              variant="outlined"
              size="small"
              type="email"
              placeholder="Enter email"
              value={value.email}
              onChange={(e) =>
                setValue({
                  ...value,
                  email: e.target.value,
                })
              }
              // error={errors?.name?true:false}
              // helperText={errors.name}
            />
          </FormControl>
        </Stack>
        {/* <Stack direction={"row"} width={"100%"} gap={2} my={1}>
          <FormControl sx={{ width: "50%" }}>
            <FormLabel sx={{ color: "#555", my: 1, fontSize: "0.9rem" }}>
              State
            </FormLabel>

            <Select
              size="small"
              value={value.stateId}
              onChange={(e) => setValue({ ...value, stateId: e.target.value })}
              sx={{ width: "fit-content" }}
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
        </Stack> */}
        <Box sx={{ display: "flex", flexDirection: "row", pt: 2, gap: 2 }}>
          <Button
            disabled={loading}
            type="submit"
            variant="contained"
            sx={{
              textTransform: "none",
              color: "white",
              fontWeight: "bold",
              px: 6,
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Update"
            )}
          </Button>
          <Button
            onClick={() => {
              handleModalClose();
            }}
            color="inherit"
            sx={{
              textTransform: "none",
              alignSelf: "center",
              border: `1px solid`,
              mr: 1,
              textDecoration: "none",
              color: "#7B7B7B",
              px: 3,
              borderColor: theme.palette.grey[400],
              p: "7px 20px",
              borderRadius: 1,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EditMember;
