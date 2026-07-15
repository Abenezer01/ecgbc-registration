import React, { useState } from "react";
import { getCurrentEthYear } from "../../utils/date-util";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import theme from "../../theme";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { VisuallyHiddenInput } from "../shared/ImageInput";
import { NewReport } from "../../types/model/report.model";
import { createFellowshipReport } from "../../store/features/report.slice";
import { useAppDispatch } from "../../store/store";
import EtDatePicker from "habesha-datepicker";

interface AddFellowshipReportProps {
  fellowshipId: string;
  handleModalClose: () => void;
}
const AddFellowshipReport: React.FC<AddFellowshipReportProps> = ({
  fellowshipId,
  handleModalClose,
}) => {
  // Generate fellowship reporting years (current Ethiopian year and previous 5 years)
  const currentEthYear = getCurrentEthYear();
  const fellowshipReportingYears = Array.from(
    { length: 6 },
    (_, i) => currentEthYear - i
  );

  const [value, setValue] = useState<NewReport>({
    report: "",
    reportedAt: null,
    crv: "",
    remark: "",
    year: fellowshipReportingYears[0], // Now uses Ethiopian year
  });

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
      year: currentEthYear,
    });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(value);
    dispatch(
      createFellowshipReport({
        newReport: { ...value, councilFellowshipId: fellowshipId },
        handleModalClose,
        resetForm,
      })
    );
  };
  return (
    <Box sx={{ p: 2, width: 400 }}>
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
        <FormControl fullWidth sx={{ my: 1 }}>
          <Box
            sx={{
              width: "100%",
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

          <Select
            size="small"
            value={fellowshipReportingYears.includes(value.year) ? value.year : fellowshipReportingYears[0]}
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
            {fellowshipReportingYears.map((year) => (
              <MenuItem sx={{ fontSize: "0.8rem" }} key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
      value={value.reportedAt}
      onChange={(date) => setValue({...value,reportedAt: date as Date | null})}
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
            size="small"
            value={value.crv}
            onChange={(e) =>
              setValue({
                ...value,
                crv: e.target.value,
              })
            }
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
            size="small"
            placeholder="Enter remark"
            value={value.remark}
            onChange={(e) =>
              setValue({
                ...value,
                remark: e.target.value,
              })
            }
          />

        </FormControl>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{ textTransform: "none", mt: 2 }}
        >
          Upload
        </Button>
      </Box>
    </Box>
  );
};

export default AddFellowshipReport;
