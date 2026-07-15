import React, {  useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import theme from "../../../theme";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { VisuallyHiddenInput } from "../../shared/ImageInput";
import EtDatePicker from "habesha-datepicker";
import { getCurrentEthYear, getEthipianYear } from "../../../utils/date-util";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { createMemberReport } from "../../../store/features/report.slice";
import { NewReport } from "../../../types/model/report.model";

interface AddMemberReportProps {
  memberId: string;
  memberCertificateIssuedDate: string;
  handleModalClose: () => void;
}
const AddMemberReport: React.FC<AddMemberReportProps> = ({
  memberId,
  memberCertificateIssuedDate,
  handleModalClose
}) => {
  const { status, task, reports } = useAppSelector((state) => state.report);
  const isSubmitting = status === "loading" && task === "create-report";

  // Calculate all possible Ethiopian years for this member (from certificate to current)
  const startYear = getEthipianYear(memberCertificateIssuedDate);
  const currentYear = getCurrentEthYear();
  const allPossibleYears = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  console.log('AddMemberReport - memberCertificateIssuedDate:', memberCertificateIssuedDate);
  console.log('AddMemberReport - Ethiopian start year:', startYear);
  console.log('AddMemberReport - Ethiopian current year:', currentYear);
  console.log('AddMemberReport - all possible Ethiopian years:', allPossibleYears);
  console.log('AddMemberReport - current reports:', reports.map(r => ({ year: r.year, id: r.id })));

  const [value, setValue] = useState<NewReport>({
    report: "",
    reportedAt: null,
    crv: "",
    remark: "",
    year: allPossibleYears.length > 0 ? allPossibleYears[0] : getCurrentEthYear(),
  });

  console.log('AddMemberReport - current selected year:', value.year);
  console.log('AddMemberReport - isSubmitting:', isSubmitting);

  const [preview, setPreview] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) setValue({ ...value, report: file });

    // Generate a preview of the selected image
    if (file) {
      setPreview(file.name);
    }
  };
  const resetForm = () => {
    setPreview("");
    setValue({
      report: "",
      reportedAt: null,
      crv: "",
      remark: "",
      year: Number(new Date().getFullYear()),
    });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    // Remove client-side year validation - let backend handle duplicate checking
    // The backend will return an error if the report already exists

    console.log('Submitting report with year:', value.year);
    console.log('All form values:', value);
    console.log('Member ID:', memberId);
    dispatch(
      createMemberReport({
        newReport: { ...value, memberId },
        handleModalClose,
        resetForm,
      })
    );
  };
  return (
    <Box sx={{ p: 2, width: 400 }}>
      {allPossibleYears.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Available Years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All years have reports submitted for this member.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Loading overlay */}
          {isSubmitting && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Stack
            direction={"row"}
            width={"100%"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography fontFamily={"Montserrat"} fontWeight={"500"} color="black">
              Report Upload
            </Typography>
            <IconButton
              onClick={() => {
                resetForm();
                handleModalClose();
              }}
            >
              <CloseIcon fontSize="small" sx={{ color: "black" }} />
            </IconButton>
          </Stack>
      <Box component={"form"} onSubmit={handleSubmit} mt={1}>
        {isSubmitting && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <FormControl fullWidth sx={{ my: 1 }}>
          {/* <FormLabel sx={{ color: "black", my: 1, fontSize: "1rem" }}>
                Upload Image
              </FormLabel> */}
          <Box
            sx={{
              width: "100%",
              //   border: `1px solid ${errors.image?theme.palette.error.main: theme.palette.grey[400]}`,
              border: `1px dashed ${theme.palette.primary.main}`,
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
              sx={{
                display: "flex",
                flexDirection: "column",
                color: "#727171",
                textTransform: "none",
                background: "none",
                width: "fit-content",
                boxShadow: "none",
                fontFamily: "Montserrat",
                fontWeight: "300",
                fontSize: "1rem",
                "&:hover": {
                  background: "none",
                  boxShadow: "none",
                },
                textAlign: "center",
                lineHeight: "1.15",
              }}
            >
              <CloudUploadIcon color="primary" />
              {/* Drag & Drop or Choose File */}
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
              />
            </Button>
            {preview && (
              <Typography
                fontFamily={"Montserrat"}
                fontSize={"0.8rem"}
                color="text.secondary"
              >
                {preview}
              </Typography>
            )}
          </Box>
          {/* <Typography
                component={"p"}
                variant="body2"
                color={theme.palette.error.main}
                px={1.5}
                fontSize={"0.8rem"}
              >
                {errors.image}
              </Typography> */}
        </FormControl>
        <FormControl fullWidth>
          <FormLabel
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "500",
              fontSize: "0.8rem",
              color: "black",
              my: 1,
            }}
          >
            Report Year
          </FormLabel>

          {/* Ensure the Select value is always valid */}
          <Select
            size="small"
            value={value.year}
            onChange={(e) =>
              setValue({
                ...value,
                year: Number(e.target.value),
              })
            }
            aria-hidden="false"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200,
                  overflowY: "auto",
                },
              },
            }}
          >
            {allPossibleYears.map((year) => (
              <MenuItem sx={{ fontSize: "0.8rem" }} key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
          {/* <Typography component={'p'} variant="body2" color={theme.palette.error.main} px={1.5} fontSize={'0.8rem'}>{errors.state}</Typography> */}
        </FormControl>
        {/* <FormControl fullWidth>
          <FormLabel
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "500",
              fontSize: "0.8rem",
              color: "black",
              mt: 1,
            }}
          >
            Report Date
          </FormLabel>
          <Box
            component={"input"}
            type="date"
            sx={{
              p: 1,
              borderColor: "#E8E8E8",
              boxShadow: "none",
              color: "#555555",
              my: 1,
            }}
            value={value.reportedAt}
            onChange={(e) => setValue({ ...value, reportedAt: e.target.value })}
            required
          />
        </FormControl> */}
        <FormControl fullWidth>
        <FormLabel
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "500",
              fontSize: "0.8rem",
              color: "black",
              mt: 1,
            }}
          >
            Report Date
          </FormLabel>
        <EtDatePicker
      // label="Select Document Date"
      value={value.reportedAt}
      onChange={(date) => setValue({...value,reportedAt: date as Date | null})}
      // minDate={new Date("YYYY-MM-DD")}
      // maxDate={new Date("YYYY-MM-DD")}
      size="small"
      />
      </FormControl>
        <FormControl fullWidth>
          <FormLabel
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "500",
              fontSize: "0.8rem",
              color: "black",
              my: 1,
            }}
          >
            CRV
          </FormLabel>
          <TextField
            variant="outlined"
            // required
            size="small"
            //   placeholder="Enter name"
            value={value.crv}
            onChange={(e) =>
              setValue({
                ...value,
                crv: e.target.value,
              })
            }
            // error={errors?.name?true:false}
            // helperText={errors.name}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabel
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "500",
              fontSize: "0.8rem",
              color: "black",
              my: 1,
            }}
          >
            Remark
          </FormLabel>
          <TextField
            variant="outlined"
            // required
            size="small"
            placeholder="Enter remark"
            value={value.remark}
            onChange={(e) =>
              setValue({
                ...value,
                remark: e.target.value,
              })
            }
            // error={errors?.name?true:false}
            // helperText={errors.name}
          />
          
        </FormControl>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ textTransform: "none", mt: 2 }}
        >
          Upload
        </Button>
      </Box>
        </>
      )}
    </Box>
  );
};

export default AddMemberReport;
