import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../api/axios";
import { useAppSelector } from "../store/store";
import { userHasPermission } from "../utils/hasPermission.util";
import { formatCertificateNumber } from "../utils/memberUtils";
import { Permissions } from "../enums/permission.enum";
import { useNavigate } from "@tanstack/react-router";
import ActionMenu from "../components/shared/ActionMenu";
import { CommonObjectState } from "../enums/common-object-state.enum";

interface Fellowship {
  name?: string;
}

interface State {
  value: string;
}

interface LocalMember {
  id: string;
  name: string;
  certificateNo: string;
  councilFellowship?: Fellowship;
  reasonForInactive?: string;
  status?: string;
  isActive?: boolean;
  state?: State;
}

const getMemberIdByCertificate = async (certificateNumber: string): Promise<string | null> => {
  try {
    const response = await api.get("/members/inactive/all");
    const members: LocalMember[] = response.data.data?.members || [];
    const member = members.find((m: LocalMember) => m.certificateNo === certificateNumber);

    if (!member) {
      throw new Error(`Member with certificate number ${certificateNumber} not found`);
    }

    return member.id;
  } catch (error) {
    console.error('Error finding member:', error);
    return null;
  }
};

const InactiveMembers = () => {
  const [inactiveMembers, setInactiveMembers] = useState<LocalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { staff } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  const canDeactivate = userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_DEACTIVATE]);

  const isMemberInactive = (member: LocalMember) => {
    if (member.state?.value === CommonObjectState.IN_ACTIVE) return true;
    if (typeof member.isActive === "boolean") return member.isActive === false;
    return false;
  };

  const fetchAllMembers = async () => {
    console.log("fetchAllMembers called");
    try {
      console.log("Making API call to /members/inactive/all");
      const response = await api.get(`/members/inactive/all?t=${Date.now()}`);
      console.log("API response:", response);
  const members: LocalMember[] = response.data.data?.members || [];
  const filteredMembers = members.filter(isMemberInactive);
  console.log(`Found ${members.length} inactive members, displaying ${filteredMembers.length}`, filteredMembers);
  setInactiveMembers(filteredMembers);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching members:", error);
      alert(`Error loading members: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("InactiveMembers useEffect triggered, staff:", staff);
    if (staff) { // Just check if user is logged in
      console.log("User is logged in, fetching members");
      fetchAllMembers();
    } else {
      console.log("User is not logged in, setting loading to false");
      setLoading(false);
    }
  }, [staff]);

  const handleRestoreMember = async (certificateNumber: string) => {
    try {
      const memberId = await getMemberIdByCertificate(certificateNumber);

      if (!memberId) {
        alert('Member not found');
        return;
      }

      await api.patch(`/members/${memberId}/restore`);
  fetchAllMembers();
  window.dispatchEvent(new CustomEvent("inactive-count-refresh", { detail: { delta: -1 } }));
      alert("Member restored successfully");
    } catch (error) {
      console.error("Error restoring member:", error);
      alert("Error restoring member");
    }
  };

  const handlePermanentlyDelete = async (certificateNumber: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this member? This will move it to the deleted records.")) {
      return;
    }
    try {
      const memberId = await getMemberIdByCertificate(certificateNumber);
      if (!memberId) {
        alert('Member not found');
        return;
      }

      await api.patch(`/members/${memberId}/delete`); // We'll implement this route
      fetchAllMembers();
      // Potentially trigger a total count refresh
      window.dispatchEvent(new CustomEvent("inactive-count-refresh", { detail: { delta: -1 } }));
      alert("Member permanently deleted");
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Error deleting member");
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAllMembers();
  };

  return (
    <Box sx={{ background: 'transparent' }}>
      <Box sx={{ background: '#1178D7', width: "100%", height: 140, backgroundImage: 'linear-gradient(90deg, #0a58a9 0%, #1178D7 50%, #3da0ff 100%)', position:'relative', overflow:'hidden' }}>
        <Box aria-hidden sx={{position:'absolute', inset:0, pointerEvents:'none'}}>
          <Box sx={{position:'absolute', width:260, height:260, top:-70, right:-70, borderRadius:'50%', background:'rgba(255,255,255,0.08)', filter:'blur(6px)'}} />
          <Box sx={{position:'absolute', width:200, height:200, bottom:-60, left:-40, borderRadius:'50%', background:'rgba(255,255,255,0.06)', filter:'blur(6px)'}} />
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 8 }, mt: -18, maxWidth:1536, mx:'auto' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            letterSpacing: "-0.5px",
            color: "#111827",
            fontFamily: 'Inter'
          }}
        >
          Inactive Members ({inactiveMembers.length})
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280", mb: 3 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1.25, flexWrap:'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate({ to: "/dashboard" })}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform:'none' }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform:'none' }}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading inactive members...</Typography>
        ) : inactiveMembers.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px dashed #e5e7eb', color: '#6B7280', background:'#fff' }}>
            No inactive members found.
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            className="modern-card-hover"
            sx={{
              borderRadius: 3,
              boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
              border: '1px solid #E5E7EB',
              backgroundColor: '#fff',
              overflow:'hidden'
            }}
          >
            <Table stickyHeader sx={{ minWidth:900, borderSpacing:'0 6px' }}>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor:'#F8FAFC', fontWeight:600, fontSize:'0.78rem', letterSpacing:'.5px', color:'#475569' } }}>
                  <TableCell>Certificate Number</TableCell>
                  <TableCell>Name of institution</TableCell>
                  <TableCell>Fellowship</TableCell>
                  <TableCell>Reason For Inactive</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactiveMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    sx={{
                      backgroundColor: '#fff',
                      '&:nth-of-type(odd)': { backgroundColor:'#FBFCFD' },
                      '&:hover': { backgroundColor:'#F1F5F9' },
                      transition:'background-color .18s ease',
                    }}
                    onClick={() => navigate({ to: `/members/${member.id}` })}
                  >
                    <TableCell sx={{ py: 1.5, fontSize:'0.9rem' }}>{formatCertificateNumber(member.certificateNo)}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize:'0.9rem', fontWeight:500 }}>{member.name}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize:'0.85rem', color:'#475569' }}>{member.councilFellowship?.name || '-'}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize:'0.85rem', color:'#475569', maxWidth:260 }}>{member.reasonForInactive || '-'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={isMemberInactive(member) ? 'Inactive' : 'Active'}
                        size="small"
                        sx={{
                          backgroundColor: isMemberInactive(member) ? '#FDEDED' : '#E6F4EA',
                          color: isMemberInactive(member) ? '#B91C1C' : '#15803D',
                          fontWeight: 600,
                          borderRadius: '14px',
                          px: 1,
                          fontSize: '0.65rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }} align="center" onClick={(e)=>e.stopPropagation()}>
                      <ActionMenu
                        size="small"
                        items={[
                          {
                            label: 'Restore',
                            onClick: () => handleRestoreMember(member.certificateNo),
                            hidden: !canDeactivate || !isMemberInactive(member),
                            disabled: !isMemberInactive(member)
                          },
                          {
                            label: 'Delete',
                            onClick: () => handlePermanentlyDelete(member.certificateNo),
                            hidden: !canDeactivate, // Assuming same permission for now, or check for specific 'delete' perm
                            color: 'error.main' // Or similar
                          }
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Export placeholder; implement if required parity with main list */}
        <Button variant="contained" sx={{ mt: 3, borderRadius: 2, fontWeight: 600, textTransform:'none' }}>Export</Button>
      </Box>
    </Box>
  );
};

export default InactiveMembers;