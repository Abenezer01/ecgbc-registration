import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Stack, Box, Typography, FormControl, FormLabel, /* other MUI imports */ } from '@mui/material';
import { Report, UpdatedReport } from '../../../types/model/report.model';
import { useAppDispatch, useAppSelector } from '../../../store/store';
import { updateMemberReport } from '../../../store/features/report.slice';
// ... other imports ...
import DocumentIcon from "../../../assets/document.svg";
import DownloadIcon from "../../../assets/download-line.svg";
import { VisuallyHiddenInput } from '../../shared/ImageInput';
import { fileUrl } from '../../../utils/file-url.util';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import theme from '../../../theme';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EtDatePicker from 'habesha-datepicker';
interface EditMemberReportProps {
  open: boolean;
  handleClose: () => void;
  report: Report;
  memberId: string;
  
}
// const formatDate = (dateString: string | Date): string => {
//     if (!dateString) return '';
//     try {
//       // Handles both ISO strings and Date objects
//       return new Date(dateString).toISOString().split('T')[0];
//     } catch (error) {
//       console.error("Error formatting date:", error);
//       return ''; // Fallback to empty string if formatting fails
//     }
//   };

const EditMemberReport: React.FC<EditMemberReportProps> = ({ open, handleClose, report }) => {
  const dispatch = useAppDispatch();
  console.log(`report `,report);
  const [localFileState, setLocalFileState] = useState<string | null>(report.file ? report.file.split('/').pop() || 'File' : null);
 const [value, setValue] = useState<UpdatedReport>({
    
    crv: report.crv || '',
    remark: report.remark || '',
    reportedAt:new Date(report.reportedAt),
    report:''
  });
  const [preview, setPreview] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset form values when the report prop changes (e.g. modal is reopened for a different report)
    setValue({
      crv: report.crv || '',
      remark: report.remark || '',
      reportedAt: new Date(report.reportedAt),
      report: '', // Reset file part of the value state
    });
    setLocalFileState(report.file ? report.file.split('/').pop() || 'File' : null);
  }, [report]); 
const {status,task} = useAppSelector(state=>state.report)
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];
      if(newFile){
        setPreview(newFile.name);
        setValue({
          ...value,
          report: newFile, // Store the File object for new upload
        });
        setLocalFileState(newFile.name); // Update display name
      }
    }
  };
  const handleRemoveFile = () => {
    setValue({
      ...value,
      report: 'remove', // Set to null to indicate removal
    });
    setLocalFileState(null); // Clear display name
  };
  const handleDownload = (fileUrl: string): void => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${report?.member?.name}-${report?.year}-report`; // Optionally set the filename, e.g., 'downloaded-file.pdf'
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleSubmit = () => {
    
    
    let reportPayload: File | 'remove' | string = ''; // Default to no change for file

    if (value.report === 'remove') { // Explicit removal
        reportPayload = 'remove';
    } else if (value.report instanceof File) { // New or changed file
        reportPayload = value.report;
    }
    

    dispatch(updateMemberReport({ 
      updatedReport: {  
        ...value, // This includes crv, remark, reportedAt
        report: reportPayload, // Send the processed file payload
        reportId:report.id 
      }
    }));
    handleClose();
  };
  const updateReportloading = status === "loading" && task === "update-report";
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Edit Report</DialogTitle>
      <DialogContent>
        {/* Form fields for year, crv, etc. */}
        <TextField 
        size="small"
          label="Year" 
          value={report.year} 
        //   onChange={(e) => setYear(e.target.value)} 
          fullWidth 
          margin="normal" 
         disabled
        />
        <TextField
        size='small'
          label="CRV" 
          value={value.crv} 
          onChange={(e) => setValue({...value, crv: e.target.value })} 
          fullWidth 
          margin="normal" 
        />
         <TextField
        size='small'
          label="Remark" 
          value={value.remark} 
          onChange={(e) => setValue({...value, remark: e.target.value })} 
          fullWidth 
          margin="normal" 
        />
         {/* <TextField
         type='date'
        size='small'
          label="Reported at" 
          value={value.reportedAt} 
          onChange={(e) => setValue({...value, reportedAt: e.target.value })} 
          fullWidth 
          InputLabelProps={{ shrink: true }} 
          margin="normal" 
        /> */}
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

                            <Box sx={{ my: 2 }}>
           <Typography variant="subtitle2" gutterBottom>Report File</Typography>
           {localFileState ? (
             <Stack
             direction={"row"}
             gap={1}
             alignItems={"center"}
           >
             <Box
               component={"img"}
               src={DocumentIcon}
               height={28}
             />
               {preview && (
              <Typography
                fontFamily={"Montserrat"}
                fontSize={"0.8rem"}
                color="text.secondary"
              >
                {preview}
              </Typography>
            )}
          {report.file && !(value.report instanceof File) && value.report !== null && value.report !== 'remove' &&  <Button
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
                 handleDownload(
                   fileUrl("report", report.file!)
                 )
               }
             >
               Download
             </Button>}  
             <Button sx={{
                 color: theme.palette.error.main,
                 borderRadius: 6,
                 textTransform: "none",
                 borderColor: theme.palette.error.main,
                 py: 0.25,
                 px: 1.5,
               }}  variant="outlined"
               startIcon={
                 <DeleteOutlineIcon />
               } onClick={handleRemoveFile}>Remove</Button>
           </Stack>
         
           ) : (
             <Typography variant="body2" sx={{ mb: 1 }}>No file uploaded.</Typography>
           )}
           <Button
             component="label"
             role={undefined}
             variant="outlined"
             startIcon={<CloudUploadIcon />}
             disabled={updateReportloading}
             fullWidth
             sx={{
              my:2
             }}
           >
             {localFileState ? "Change File" : "Upload File"}
             <VisuallyHiddenInput
               disabled={updateReportloading}
               type="file"
               onChange={handleFileChange}
               accept=".pdf"
             />
           </Button>
         </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction={'row'} gap={2} alignItems={'center'}>

        <Button    sx={{ textTransform: "none" }} onClick={handleClose}>Cancel</Button>
        <Button
          fullWidth
         onClick={handleSubmit}
          disabled={updateReportloading}
          variant="contained"
          sx={{ textTransform: "none" }}
          >
            {updateReportloading ? <CircularProgress /> :'  Save changes'}
        
        </Button>
            </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default EditMemberReport;