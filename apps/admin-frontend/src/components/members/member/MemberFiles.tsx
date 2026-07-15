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
import theme from "../../../theme"; 
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DocumentIcon from "../../../assets/document.svg";
import DownloadIcon from "../../../assets/download-line.svg";
import { useEffect, useState } from "react";
import { Transition } from "../../shared/ModalTransition";
// import AddMemberFile from "./AddMemberFile";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { deleteFile, fetchFiles } from "../../../store/features/file.slice";
import { fileUrl } from "../../../utils/file-url.util";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddMemberFiles from "./AddMemberFiles";
import FileViewer from "../../shared/FileViewer";
import { userHasPermission } from "../../../utils/hasPermission.util";
import { Permissions } from "../../../enums/permission.enum";
import { ethiopianDate } from "../../../utils/date-util";
interface MemberFilesProps {
  memberId: string;
}
const MemberFiles: React.FC<MemberFilesProps> = ({ memberId }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const handleModalClose = () => {
    setOpenModal(false);
  };
  const { staff } = useAppSelector((state) => state.auth);
  const { member } = useAppSelector((state) => state.member);
  const { files, status, task } = useAppSelector((state) => state.file);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (memberId) {
      dispatch(fetchFiles({ member: memberId , isFromSelamMinster: false}));
    }
  }, [memberId, dispatch]);
  const handleDownload = (fileUrl: string): void => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${member?.name}-report`; // Optionally set the filename, e.g., 'downloaded-file.pdf'
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);

  const handleView = (url: string, name?: string) => {
    // fileUrl() returns full URL; FileViewer expects a relative or absolute URL usable by axios
    // we pass the path part if backend is same origin; for safety pass the full URL
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
          {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE,Permissions.FILE_ADD]) && (
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
              Add File
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
           {files.length > 0 &&
              files.map((file) => (
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
                        <Stack gap={1} sx={{ overflow: 'hidden' }}>
                          <Typography
                            fontFamily={"Montserrat"}
                            fontWeight={"400"}
                            fontSize={"0.9rem"}
                            noWrap // Truncate long text
                            title={file.fileName} // Show full name on hover
                          >
                            {file.fileName}
                          </Typography>
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
                              alignSelf: 'flex-start' // Align button to the start
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
                            sx={{ ml: 1, color: '#2563eb', borderColor: '#2563eb33', borderRadius: 6, textTransform: 'none' }}
                            onClick={() => handleView(fileUrl('file', file.file!), file.fileName)}
                          >
                            View
                          </Button>
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4} md={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Stack direction="row" alignItems="center" justifyContent={{ xs: 'space-between', sm: 'flex-end' }} >
                        <Typography
                          fontFamily={"Montserrat"}
                          fontWeight={"400"}
                          fontSize={"0.8rem"}
                          color="#727171"
                          fontStyle={"italic"}
                          sx={{ mr: 1 }}
                        >
                          {/* {dayjs(file.createdAt).format("MMM DD, YYYY")} */}
                          {ethiopianDate(file.createdAt!)}
                        </Typography>
                       {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE,Permissions.FILE_DELETE]) &&<IconButton
                          sx={{ p: 0 }}
                          onClick={() => {
                            dispatch(
                              deleteFile({ id: file.id, handleModalClose })
                            );
                          }}
                        >
                          <DeleteForeverIcon sx={{ color: "#ad2c2c" }} />
                        </IconButton>} 
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ))}
          </Stack>
        )}
      </Box>
      <Dialog
        open={openModal}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        keepMounted
      >
        {/* {member && (
          <AddMemberFile
            memberId={member.id}
            handleModalClose={handleModalClose}
          />
        )} */}
          {member && (
          <AddMemberFiles
            memberId={member.id}
            handleModalClose={handleModalClose}
          />
        )}
      </Dialog>
  <FileViewer open={viewerOpen} onClose={() => setViewerOpen(false)} fileUrl={viewerUrl} fileName={viewerName} />
    </Stack>
  );
};

export default MemberFiles;
