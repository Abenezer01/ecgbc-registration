import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ open, onClose, fileUrl, fileName }) => {
  
  // Helper to determine content type from extension since we are not fetching the blob manually anymore
  const getFileType = (name?: string) => {
    if (!name) return 'unknown';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'unknown';
  };

  const fileType = getFileType(fileName || '');

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (!fileUrl) return <Box>Unable to preview file.</Box>;

    if (fileType === 'pdf') {
      return (
        <iframe
          title={fileName || 'pdf-viewer'}
          src={fileUrl}
          style={{ width: '100%', height: '80vh', border: 'none' }}
        />
      );
    }

    if (fileType === 'image') {
      return (
        <img 
          src={fileUrl} 
          alt={fileName || 'file'} 
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            // Could show a fallback error message here
          }}
        />
      );
    }

    // Fallback: provide an external download link
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>Preview not available for this file type.</Box>
        <Button startIcon={<DownloadIcon />} variant="contained" onClick={handleDownload}>
          Download
        </Button>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{fileName || 'File'}</span>
        <Box>
          <Tooltip title="Open in new tab">
            <span>
              <IconButton
                disabled={!fileUrl}
                onClick={() => {
                  if (fileUrl) window.open(fileUrl, '_blank');
                }}
                size="small"
              >
                <OpenInNewIcon />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minHeight: 160, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleDownload} disabled={!fileUrl} startIcon={<DownloadIcon />}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileViewer;
