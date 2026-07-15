// Similar to InactiveMembers but fetching deleted ones
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";
import { Member } from "../types/model/member.model";
import { useAppSelector } from "../store/store";
import { userHasPermission } from "../utils/hasPermission.util";
import { Permissions } from "../enums/permission.enum";
import { formatCertificateNumber } from "../utils/memberUtils";

// Define strict type for response matching the active list
interface DeletedMember extends Member {
  // Add any specific fields if needed
}

const DeletedMembers = () => {
  const navigate = useNavigate();
  const { staff } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [deletedMembers, setDeletedMembers] = useState<DeletedMember[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const canDeactivate = userHasPermission(staff?.role?.permissions ?? [], [
    Permissions.MEMBER_DEACTIVATE,
  ]);

  const fetchDeletedMembers = async () => {
    try {
      const response = await api.get<{
        status: string;
        data: { members: DeletedMember[] };
      }>("/members/deleted/list", {
        params: {
          limit: 100, // Should probably paginate in real app
        },
      });
      setDeletedMembers(response.data.data.members || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching deleted members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if logged in
    if (staff) {
        fetchDeletedMembers();
    } else {
        setLoading(false);
    }
  }, [staff]);

  const handleRefresh = () => {
    setLoading(true);
    fetchDeletedMembers();
  };

  if (!loading && !canDeactivate) {
      return (
          <Box p={4} textAlign="center">
              <Typography variant="h6" color="error">Access Denied</Typography>
          </Box>
      )
  }

  return (
    <Box sx={{ background: "transparent" }}>
      <Box
        sx={{
          background: "#ef4444", // Red header for deleted zone
          width: "100%",
          height: 140,
          backgroundImage:
            "linear-gradient(90deg, #b91c1c 0%, #ef4444 50%, #f87171 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 260,
              height: 260,
              top: -70,
              right: -70,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              filter: "blur(6px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 200,
              height: 200,
              bottom: -60,
              left: -40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              filter: "blur(6px)",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 8 }, mt: -18, maxWidth: 1536, mx: "auto" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            letterSpacing: "-0.5px",
            color: "#fff", // White text on red bg
            fontFamily: "Inter",
          }}
        >
          Permanently Deleted Records
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 3 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2,
            gap: 1.25,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained" 
            color="inherit"
            onClick={() => navigate({ to: "/dashboard" })}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", color: '#ef4444', bgcolor: 'white', '&:hover': { bgcolor: '#f3f4f6' } }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading deleted members...</Typography>
        ) : deletedMembers.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px dashed #e5e7eb",
              color: "#6B7280",
              background: "#fff",
            }}
          >
            No deleted members found.
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            className="modern-card-hover"
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
              border: "1px solid #E5E7EB",
              backgroundColor: "#fff",
              overflow: "hidden",
            }}
          >
            <Table stickyHeader sx={{ minWidth: 900, borderSpacing: "0 6px" }}>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      backgroundColor: "#F8FAFC",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      letterSpacing: ".5px",
                      color: "#475569",
                    },
                  }}
                >
                  <TableCell>Certificate Number</TableCell>
                  <TableCell>Name of institution</TableCell>
                  <TableCell>Fellowship</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deletedMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    sx={{
                      backgroundColor: "#fff",
                      "&:nth-of-type(odd)": { backgroundColor: "#FBFCFD" },
                      "&:hover": { backgroundColor: "#F1F5F9" },
                      transition: "background-color .18s ease",
                    }}
                  >
                    <TableCell sx={{ py: 1.5, fontSize: "0.9rem" }}>
                      {formatCertificateNumber(member.certificateNo)}
                    </TableCell>
                    <TableCell
                      sx={{ py: 1.5, fontSize: "0.9rem", fontWeight: 500 }}
                    >
                      {member.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1.5,
                        fontSize: "0.85rem",
                        color: "#475569",
                      }}
                    >
                      {member.councilFellowship?.name || "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1.5,
                        fontSize: "0.85rem",
                        color: "#475569",
                        maxWidth: 260,
                      }}
                    >
                      {member.reasonForInactive || "-"}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label="Deleted"
                        size="small"
                        sx={{
                          backgroundColor: "#fef2f2",
                          color: "#991b1b",
                          fontWeight: 600,
                          borderRadius: "14px",
                          px: 1,
                          fontSize: "0.65rem",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={async () => {
                           if(window.confirm(`Restore ${member.name} to Inactive list?`)) {
                             try {
                               await api.patch(`/members/${member.id}/restore-inactive`);
                               fetchDeletedMembers();
                               alert("Member restored to Inactive list");
                             } catch(e) {
                               console.error(e);
                               alert("Failed to restore member");
                             }
                           }
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                      >
                        Restore
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={async () => {
                           if(window.confirm(`Are you SURE you want to PERMANENTLY delete ${member.name}? The data will be lost forever.`)) {
                             try {
                               await api.delete(`/members/${member.id}/hard`);
                               fetchDeletedMembers();
                               alert("Member permanently deleted");
                             } catch(e) {
                               console.error(e);
                               alert("Failed to delete member");
                             }
                           }
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', ml: 1 }}
                      >
                        Delete Permanently
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default DeletedMembers;
