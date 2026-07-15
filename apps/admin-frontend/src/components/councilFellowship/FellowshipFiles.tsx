import {
  Box,
  Button,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import theme from "../../theme"; 
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DocumentIcon from "../../assets/document.svg";
import DownloadIcon from "../../assets/download-line.svg";
import { useEffect, useState } from "react";
import { Transition } from "../shared/ModalTransition";
import { useAppDispatch, useAppSelector } from "../../store/store";
// Note: Currently fellowship files are part of fellowship object. 
// If there is a separate fetchFiles for fellowship that filters by fellowship ID, use that.
// Looking at Redux slice, 'file.slice.ts' usually fetches generically.
import { deleteFile, fetchFiles } from "../../store/features/file.slice"; 
import { fileUrl } from "../../utils/file-url.util";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileViewer from "../shared/FileViewer";
import { userHasPermission } from "../../utils/hasPermission.util";
import { Permissions } from "../../enums/permission.enum";
import { ethiopianDate } from "../../utils/date-util";
import AddFellowshipFiles from "./AddFellowshipFiles";

interface FellowshipFilesProps {
  fellowshipId: string;
}

const FellowshipFiles: React.FC<FellowshipFilesProps> = ({ fellowshipId }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const handleModalClose = () => {
    setOpenModal(false);
  };
  const { staff } = useAppSelector((state) => state.auth);
  // We can use the global file slice if it supports filtering by fellowship, 
  // OR we can use the files array from the fellowship object if it's already loaded.
  // The 'fetchFiles' action in 'file.slice' likely supports query params.
  // Let's assume we use the file slice to manage these files separate from the main object to support delete/add without full re-fetch.
  const { files, status, task } = useAppSelector((state) => state.file);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (fellowshipId) {
       // Assuming fetchFiles accepts a filters object. 
       // In MemberFiles it was { member: memberId }. Here it might be { fellowship: fellowshipId } or similar depending on backend API.
       // Based on member implementation, let's try assuming the backend supports fellowship filter or we rely on the fellowship object's files.
       // However, to keep it "Right side", independent fetching is better.
       // Let's check the API or just use the same pattern.
       // Looking at MemberFiles: dispatch(fetchFiles({ member: memberId , isFromSelamMinster: false}));
       // If the backend `find_file` supports `councilFellowshipId`, we should use that.
       // IF NOT, we might need to rely on the fellowship object.
       // BUT, let's try to trust the pattern.
       dispatch(fetchFiles({ fellowship: fellowshipId })); 
    }
  }, [fellowshipId, dispatch]);

  const handleDownload = (fileUrl: string): void => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `fellowship-file`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  const handleView = (url: string, name?: string) => {
    setViewerUrl(url);
    setViewerName(name || null);
    setViewerOpen(true);
  };

  const loading = status === "loading" && task === "fetch-files";

  return (
    <Stack gap={2}>
      <Box
        sx={{
          backgroundColor: "#F8F9FA",
          px: 2,
          py: 0,
          borderRadius: 1,
        }}
      >
        <Stack
          direction={"row"}
          width={"100%"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography
            color="black"
            my={2}
            fontFamily={"Montserrat"}
            fontWeight={"400"}
            fontSize={"1rem"}
          >
            Files
          </Typography>
          {userHasPermission(staff?.role?.permissions??[], [Permissions.COUNCIL_FELLOWSHIP_CHANGE]) && (
            <Button
              endIcon={
                <AddCircleIcon sx={{ color: theme.palette.primary.main }} />
              }
              sx={{
                textTransform: "none",
                py: 0.5,
                fontSize: "0.9rem",
                fontWeight: "400",
                letterSpacing: 0,
                backgroundColor: "transparent",
                fontFamily: "Montserrat",
                boxShadow: "none",
                color: "#727171",
                lineHeight: 1,
              }}
              variant="contained"
              onClick={() => setOpenModal(true)}
            >
              Add New
            </Button>
           )}
        </Stack>
      </Box>

      <Box
        sx={{
          backgroundColor: "#F8F9FA",
          p: 2,
          maxHeight: 400,
          overflowY: "auto",
          scrollbarWidth: "thin",
        }}
      >
        {loading ? (
          <LinearProgress />
        ) : (
          <Stack gap={2}>
            {files.length === 0 && (
               <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No files attached.
               </Typography>
            )}
            {files.map((file) => (
              <Box
                key={file.id}
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  boxShadow: theme.shadows[1],
                  p: 2,
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={8} md={9}>
                    <Stack direction="row" gap={2} alignItems="center">
                      <Box component={"img"} src={DocumentIcon} height={60} />
                      <Stack gap={1} sx={{ overflow: "hidden" }}>
                        <Typography
                          fontFamily={"Montserrat"}
                          fontWeight={"400"}
                          fontSize={"0.9rem"}
                          noWrap
                          title={file.fileName}
                        >
                          {file.fileName || "File"}
                        </Typography>
                        <Stack direction="row" gap={1}>
                          <Button
                            variant="outlined"
                            startIcon={
                              <Box component={"img"} src={DownloadIcon} />
                            }
                            sx={{
                              color: "#7C7C7C",
                              borderRadius: 6,
                              textTransform: "none",
                              borderColor: "#7c7c7c",
                              py: 0.25,
                              px: 1.5,
                            }}
                            onClick={() =>
                              handleDownload(fileUrl("file", file.file!))
                            }
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            sx={{
                              ml: 1, 
                              color: '#2563eb', 
                              borderColor: '#2563eb33', 
                              borderRadius: 6, 
                              textTransform: 'none',
                              py: 0.25,
                              px: 1.5
                            }}
                            onClick={() => handleView(fileUrl('file', file.file!), file.fileName)}
                          >
                            View
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={4} md={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Stack direction="row" alignItems="center" justifyContent={{ xs: 'space-between', sm: 'flex-end' }}>
                      <Typography
                        fontFamily={"Montserrat"}
                        fontWeight={"400"}
                        fontSize={"0.8rem"}
                        color="#727171"
                        fontStyle={"italic"}
                        sx={{ mr: 1 }}
                      >
                        {ethiopianDate(file.createdAt!)}
                      </Typography>
                      {userHasPermission(staff?.role?.permissions??[], [Permissions.COUNCIL_FELLOWSHIP_CHANGE]) && (
                        <IconButton
                          sx={{ p: 0 }}
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this file?")) {
                                dispatch(deleteFile({ id: file.id })).then(() => {
                                    dispatch(fetchFiles({ fellowship: fellowshipId }));
                                });
                            }
                          }}
                          title="Delete"
                        >
                          <DeleteForeverIcon sx={{ color: "#ad2c2c" }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Modals */}
      <Dialog
        open={openModal}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        keepMounted
      >
         <AddFellowshipFiles
          fellowshipId={fellowshipId}
          handleModalClose={() => {
             handleModalClose();
             dispatch(fetchFiles({ fellowship: fellowshipId }));
          }}
        />
      </Dialog>
      
      {viewerOpen && viewerUrl && (
        <FileViewer
          open={viewerOpen}
          fileUrl={viewerUrl}
          fileName={viewerName || "Document"}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </Stack>
  );
};

export default FellowshipFiles;
