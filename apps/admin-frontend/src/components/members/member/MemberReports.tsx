import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ReportWarning from "./ReportWarning";
import DocumentIcon from "../../../assets/document.svg";
import DownloadIcon from "../../../assets/download-line.svg";
import { Transition } from "../../shared/ModalTransition";
import AddMemberReport from "./AddMemberReport";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import {
  deleteMemberReport,
  fetchReports,
  updateMemberReport,
} from "../../../store/features/report.slice";
import { fileUrl } from "../../../utils/file-url.util";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { VisuallyHiddenInput } from "../../shared/ImageInput";
import { getUnReportedYears } from "../../../utils/not-reported-years.util";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Report } from "../../../types/model/report.model";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditMemberReport from "./EditMemberReport";
import { userHasPermission } from "../../../utils/hasPermission.util";
import { Permissions } from "../../../enums/permission.enum";
import FileViewer from "../../shared/FileViewer";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ethiopianDate } from "../../../utils/date-util";

interface MemberReportsProps {
  memberId: string;
  memberCertificateIssuedDate: string;
}
const MemberReports: React.FC<MemberReportsProps> = ({ memberId,memberCertificateIssuedDate }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false); 
  const handleModalOpen = () => {
    // Refetch reports to ensure we have the latest data before opening the modal
    if (memberId) {
      dispatch(fetchReports({ member: memberId }));
    }
    setOpenModal(true);
  };
 
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleModalClose = () => {
    setAnchorEl(null);
    setOpenModal(false);
  };
  const handleClick = (
    event: React.MouseEvent<HTMLElement>,
    report: Report
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };
  const handleOpenEditModal = () => {
    setOpenEditModal(true);
    handleModalClose(); // Close the menu
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedReport(null); // Clear selected report
  };
  const { staff } = useAppSelector((state) => state.auth);
  const { member } = useAppSelector((state) => state.member);
  const { reports, status, task } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (memberId) {
      dispatch(fetchReports({ member: memberId }));
    }
  }, [memberId, dispatch]);

  const notReportedYears = getUnReportedYears(reports,memberCertificateIssuedDate);

  console.log('MemberReports - reports array:', reports);
  console.log('MemberReports - memberCertificateIssuedDate:', memberCertificateIssuedDate);
  console.log('MemberReports - notReportedYears:', notReportedYears);
  console.log('MemberReports - detailed reports:', reports.map(r => ({ year: r.year, id: r.id })));
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
    setViewerUrl(url);
    setViewerName(name || null);
    setViewerOpen(true);
  };
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    reportId: string
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      dispatch(
        updateMemberReport({ updatedReport: { report: file, reportId } })
      );
    }
  };
  const handleDeleteReport = (reportId:string) => {

      dispatch(deleteMemberReport(reportId));
      handleModalClose();
    
  };
  const loading = status === "loading" && task === "fetch-reports";
  const updateReportloading = status === "loading" && task === "update-report";
  const deleteReportloading = status === "loading" && task === "delete-report";
  return (
    <>
      <Box
        sx={{
          borderRadius: 4,
          background: '#ffffffcc',
          backdropFilter: 'blur(6px)',
          p: 3,
          boxShadow: '0 6px 28px -8px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          width: '100%'
        }}
      >
        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} mb={1.5} gap={2} flexWrap={'wrap'}>
          <Stack gap={0.5}>
            <Typography fontSize={'.75rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55 }}>Reports</Typography>
            <Typography fontSize={'1.05rem'} fontWeight={600} fontFamily={'Inter'}>Report Records</Typography>
          </Stack>
          {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE,Permissions.REPORT_ADD])  && (
            <Button
              startIcon={<AddCircleIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '.8rem',
                px: 2.5,
                py: 1,
                borderRadius: 999,
                background: 'linear-gradient(90deg,#2563eb,#1d4ed8)',
                color: '#fff',
                boxShadow: '0 4px 14px -2px rgba(37,99,235,0.45)',
                '&:hover': { background: 'linear-gradient(90deg,#1d4ed8,#1e40af)' }
              }}
              onClick={handleModalOpen}
            >
              Add Report
            </Button>
          )}
        </Stack>
        {loading ? (
          <LinearProgress sx={{ mt: 2 }} />
        ) : (
          <>
            {notReportedYears.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <ReportWarning notReportedYears={notReportedYears} />
              </Box>
            )}
            <Box>
              {reports.length > 0 ? (
                <Stack gap={2}>
                  {reports.map((report) => (
                    <Box
                      key={report.id}
                      sx={{
                        position: 'relative',
                        borderRadius: 3,
                        p: 2.25,
                        pl: 2.75,
                        background: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: 28,
                        flexWrap: 'wrap',
                        alignItems: 'stretch',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          borderTopLeftRadius: 12,
                          borderBottomLeftRadius: 12,
                          background: 'linear-gradient(180deg,#2563eb,#1d4ed8)'
                        },
                        transition: 'transform .25s ease, box-shadow .25s ease',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px -4px rgba(0,0,0,0.12)' }
                      }}
                    >
                      <Stack direction={'row'} gap={4} flex={1} minWidth={0} flexWrap={'wrap'}>
                        <Stack sx={{ minWidth: 90 }}>
                          <Typography fontSize={'.55rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: .5 }}>Year</Typography>
                          <Typography fontWeight={600} fontSize={'.9rem'} fontFamily={'Inter'}>{report.year} E.C</Typography>
                        </Stack>
                        <Stack sx={{ minWidth: 90 }}>
                          <Typography fontSize={'.55rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: .5 }}>CRV</Typography>
                          <Typography fontSize={'.85rem'}>{report.crv || '-'}</Typography>
                        </Stack>
                        <Stack sx={{ minWidth: 130 }}>
                          <Typography fontSize={'.55rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: .5 }}>Reported Date</Typography>
                          <Typography fontSize={'.75rem'} color={'#475569'}>{ethiopianDate(report.reportedAt)}</Typography>
                        </Stack>
                        <Stack sx={{ minWidth: 180 }}>
                          <Typography fontSize={'.55rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: .5 }}>File</Typography>
                          {report.file ? (
                            <Stack direction={'row'} gap={1} alignItems={'center'}>
                              <Box component={'img'} src={DocumentIcon} height={28} />
                              <Button
                                variant="outlined"
                                startIcon={<Box component={'img'} src={DownloadIcon} />}
                                sx={{
                                  color: '#2563eb',
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  borderColor: '#2563eb33',
                                  fontSize: '.7rem',
                                  px: 1.5,
                                  py: .5,
                                  '&:hover': { borderColor: '#2563eb77', background: '#2563eb08' }
                                }}
                                onClick={() => handleDownload(fileUrl('report', report.file!))}
                              >
                                Download
                              </Button>
                              <Button variant="outlined" startIcon={<OpenInNewIcon />} sx={{ ml: 1, color: '#2563eb', borderColor: '#2563eb33', borderRadius: 6, textTransform: 'none' }} onClick={() => handleView(fileUrl('report', report.file!), `${report.year}-report.pdf`)}>
                                View
                              </Button>
                            </Stack>
                          ) : (
                            <Button
                              component="label"
                              role={undefined}
                              variant="outlined"
                              startIcon={<CloudUploadIcon />}
                              sx={{
                                color: '#475569',
                                borderRadius: 2,
                                textTransform: 'none',
                                borderColor: '#cbd5e1',
                                fontSize: '.7rem',
                                px: 1.5,
                                py: .5,
                                '&:hover': { borderColor: '#94a3b8', background: '#f1f5f9' }
                              }}
                            >
                              {updateReportloading ? <CircularProgress size={16} /> : 'Upload'}
                              <VisuallyHiddenInput
                                disabled={updateReportloading}
                                type="file"
                                onChange={(e) => { handleFileChange(e, report.id); }}
                                accept=".pdf"
                              />
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'flex-end'} sx={{ minWidth: 40 }}>
                        <Button
                          variant="text"
                          sx={{ color: '#64748b', minWidth: 0, p: 1 }}
                          onClick={(e) => handleClick(e, report)}
                          startIcon={<MoreVertIcon />}
                        />
                        {selectedReport && selectedReport.id === report.id && (
                          <Menu
                            id="report-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleModalClose}
                            slotProps={{ paper: { sx: { borderRadius: 2, mt: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } } }}
                          >
                            {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE,Permissions.REPORT_CHANGE]) && <MenuItem onClick={handleOpenEditModal} disabled={updateReportloading}>
                              <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
                              <ListItemText>Edit</ListItemText>
                            </MenuItem>}
                            {userHasPermission(staff?.role?.permissions??[],[Permissions.MEMBER_CHANGE,Permissions.REPORT_DELETE]) && <MenuItem onClick={() => { handleDeleteReport(report.id); }} disabled={deleteReportloading}>
                              <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                              <ListItemText>Delete</ListItemText>
                            </MenuItem>}
                          </Menu>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" fontSize={'.75rem'}>No reports</Typography>
              )}
            </Box>
          </>
        )}
      </Box>
      <Dialog
        open={openModal}
        onClose={handleModalClose}
        TransitionComponent={Transition}
        keepMounted
      >
        {member && (
          <AddMemberReport
            memberId={member.id}
            memberCertificateIssuedDate={memberCertificateIssuedDate}
            handleModalClose={handleModalClose}
          />
        )}
         {selectedReport && member && (
        <EditMemberReport 
          open={openEditModal}
          handleClose={handleCloseEditModal}
          report={selectedReport}
          memberId={member.id}
        />
      )}
      </Dialog>
  <FileViewer open={viewerOpen} onClose={() => setViewerOpen(false)} fileUrl={viewerUrl} fileName={viewerName} />
    </>
  );
};

export default MemberReports;
