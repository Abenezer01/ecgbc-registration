import React, { useCallback, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import theme from "../../theme";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { createFellowshipFiles } from "../../store/features/file.slice"; // Assuming this action exists or needs to be mapped
import { formatFileSize } from "../../utils/format-file-size.util";

interface AddFellowshipFilesProps {
  fellowshipId: string;
  handleModalClose: () => void;
}
const MAX_FILES = 5;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

const AddFellowshipFiles: React.FC<AddFellowshipFilesProps> = ({ fellowshipId, handleModalClose }) => {
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

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setFiles([]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    if (error) return;
    
    // Dispatch the action to create files for fellowship
    // Note: I might need to implement createFellowshipFiles in the slice
    dispatch(createFellowshipFiles({ 
        files, 
        councilFellowshipId: fellowshipId 
    }))
      .unwrap()
      .then(() => {
        handleModalClose();
      })
      .catch(() => {
        // Error handling if needed, usually handled by slice/toast
      });
  };

  const loading = status === "loading" && task === "create-fellowship-files"; // Adjust task name if needed

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Upload Files
        </Typography>
        <IconButton onClick={handleModalClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            border: `2px dashed ${theme.palette.primary.light}`,
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: theme.palette.grey[50],
            mb: 2,
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            ref={inputRef}
            style={{ display: "none" }}
            onChange={onInputChange}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body1" fontWeight={500}>
            Click or Drag files here
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Allowed: PDF, DOCX, XLS, PNG, JPG (Max 5 files, Total 50MB)
          </Typography>
        </Box>

        {files.length > 0 && (
          <Stack spacing={1} mb={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Selected Files ({files.length})</Typography>
              <Button size="small" color="error" onClick={clearAll}>
                Clear All
              </Button>
            </Stack>
            {files.map((f, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  boxShadow: 1,
                }}
              >
                <Stack>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {f.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(f.size)}
                  </Typography>
                </Stack>
                <IconButton size="small" onClick={() => removeFile(i)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Total Size Indicator */}
        {files.length > 0 && (
          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={(currentTotalSize / MAX_TOTAL_SIZE_BYTES) * 100}
              color={currentTotalSize > MAX_TOTAL_SIZE_BYTES ? "error" : "primary"}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: "right" }}>
              {formatFileSize(currentTotalSize)} / {MAX_TOTAL_SIZE_MB}MB
            </Typography>
          </Box>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
            <Button onClick={handleModalClose} disabled={loading} color="inherit">
            Cancel
            </Button>
            <Button
            type="submit"
            variant="contained"
            disabled={loading || files.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
            {loading ? "Uploading..." : "Upload Files"}
            </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default AddFellowshipFiles;
