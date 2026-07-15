import React, { useCallback, useMemo, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton, Stack, Typography } from "@mui/material";
import theme from "../../../theme";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { createMemberFiles } from "../../../store/features/file.slice";
import { formatFileSize } from "../../../utils/format-file-size.util";

interface AddMemberFilesProps {
  memberId: string;
  handleModalClose: () => void;
}
const MAX_FILES = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

const AddMemberFilesFromSM: React.FC<AddMemberFilesProps> = ({ memberId, handleModalClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { status, task } = useAppSelector((state) => state.file);
  const dispatch = useAppDispatch();

  const currentTotalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  const validateAndMergeFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const merged = [...files];
      for (const f of incoming) {
        const exists = merged.some(
          (m) => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified
        );
        if (!exists) merged.push(f);
      }
      if (merged.length > MAX_FILES) {
        setError(`You can select a maximum of ${MAX_FILES} files.`);
        return;
      }
      const total = merged.reduce((s, f) => s + f.size, 0);
      if (total > MAX_TOTAL_SIZE_BYTES) {
        setError(
          `Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB. Current: ${(
            total / (1024 * 1024)
          ).toFixed(2)}MB`
        );
        return;
      }
      setFiles(merged);
    },
    [files]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (list.length) validateAndMergeFiles(list);
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) validateAndMergeFiles(dropped);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => { setFiles([]); setError(null); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    if (error) return;
    dispatch(
      createMemberFiles({ newFile: { files, memberId }, handleModalClose, resetForm: clearAll, isFromSelamMinster: true })
    );
  };

  const loading = status === "loading" && task === "create-files";

  return (
    <Box sx={{ p: 2, width: 440 }}>
      <Stack direction={"row"} width={"100%"} alignItems={"center"} justifyContent={"space-between"}>
        <Typography fontFamily={"Montserrat"} fontWeight={"500"} color="black">
          File Upload <Box component={"span"} sx={{ fontWeight: "300" }}>(From Selam Minister)</Box>
        </Typography>
        <IconButton onClick={() => { clearAll(); handleModalClose(); }}>
          <CloseIcon fontSize="small" sx={{ color: "black" }} />
        </IconButton>
      </Stack>

      <Box component={"form"} onSubmit={handleSubmit} mt={1}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ my: 1 }}>
          <Box
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            sx={{
              width: "100%",
              border: `1px dashed ${error ? theme.palette.error.main : theme.palette.primary.main}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              minHeight: 120,
              p: 2,
              cursor: "pointer",
              background:
                theme.palette.mode === "light"
                  ? "linear-gradient(180deg, rgba(2,6,23,0.02), rgba(2,6,23,0))"
                  : theme.palette.background.paper,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <CloudUploadIcon color="primary" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" align="center">
              Drag & drop files here, or click to select
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Max {MAX_FILES} files • {MAX_TOTAL_SIZE_MB}MB total
            </Typography>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={onInputChange}
              style={{ display: "none" }}
            />
          </Box>

          <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} mt={1}>
            {files.map((f, idx) => (
              <Chip
                key={`${f.name}-${f.size}-${f.lastModified}`}
                label={`${f.name} • ${formatFileSize(f.size)}`}
                onDelete={() => removeFile(idx)}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={files.length ? 1 : 0}>
            <Typography variant="caption" color="text.secondary">
              Total: {formatFileSize(currentTotalSize)}
            </Typography>
            {files.length > 0 && (
              <Button size="small" color="inherit" onClick={clearAll} sx={{ textTransform: "none" }}>
                Clear all
              </Button>
            )}
          </Stack>
        </FormControl>

        <Button fullWidth type="submit" variant="contained" sx={{ textTransform: "none", mt: 2 }}>
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Upload"}
        </Button>
      </Box>
    </Box>
  );
};

export default AddMemberFilesFromSM;
