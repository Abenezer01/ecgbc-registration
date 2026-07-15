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
import theme from "../../../theme";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { VisuallyHiddenInput } from "../../shared/ImageInput";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { NewFile } from "../../../types/model/file.model";
import { createMemberFile } from "../../../store/features/file.slice";

interface AddMemberFileProps {
  memberId: string;
  handleModalClose: () => void;
}
const AddMemberFile: React.FC<AddMemberFileProps> = ({
  memberId,
  handleModalClose,
}) => {
  const [value, setValue] = useState<NewFile>({
    file: "",
    fileName: "",
    memberId: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const { status, task } = useAppSelector((state) => state.file);
  const dispatch = useAppDispatch();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) setValue({ ...value, file });

    // Generate a preview of the selected image
    if (file) {
      setPreview(file.name);
    }
  };
  const resetForm = () => {
    setPreview("");
    setValue({
      file: "",
      fileName: "",
    });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(value);
    if (value.file)
      dispatch(
        createMemberFile({
          newFile: { ...value, memberId },
          handleModalClose,
          resetForm,
        })
      );
  };

  const loading = status === "loading" && task === "create-file";
  return (
    <Box sx={{ p: 2, width: 400 }}>
      <Stack
        direction={"row"}
        width={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography fontFamily={"Montserrat"} fontWeight={"500"} color="black">
          File Upload
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
            File Name
          </FormLabel>
          <TextField
            variant="outlined"
            required
            size="small"
            placeholder="Enter file name"
            value={value.fileName}
            onChange={(e) =>
              setValue({
                ...value,
                fileName: e.target.value,
              })
            }
            // error={errors?.name?true:false}
            // helperText={errors.name}
          />
        </FormControl>
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
                accept=".pdf, .doc, .xls, .png, .jpg, .jpeg "
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

        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{ textTransform: "none", mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Upload"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default AddMemberFile;
