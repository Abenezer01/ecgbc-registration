import React from "react";
import {
  Box,
  Stack,
  Typography
} from "@mui/material";
import { CouncilFellowship } from "../../types/model/fellowship.model";
import { formatCertificateNumber } from "../../utils/memberUtils";
import { toEthiopianDateText } from "../../utils/ethiopian-date.util";
import { CommonObjectState } from "../../enums/common-object-state.enum";

interface DetailProps {
  fellowship: CouncilFellowship;
}

export const FellowshipStatusBanner: React.FC<DetailProps> = ({ fellowship }) => {
  if (!fellowship) return null;
  const isInactive = fellowship.state?.value === CommonObjectState.IN_ACTIVE;

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          p: 3,
          background: isInactive ? 'linear-gradient(135deg,#fff5f5,#ffe1e1)' : 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
          border: isInactive ? '1px solid #fecaca' : '1px solid #bbf7d0',
          boxShadow: isInactive ? '0 4px 14px -2px rgba(220,38,38,0.25)' : '0 4px 14px -2px rgba(16,185,129,0.25)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={3}>
          <Stack direction='row' alignItems='center' gap={2}>
            <Box sx={{
              width: 54,
              height: 54,
              borderRadius: 2.5,
              background: isInactive ? '#fee2e2' : '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              color: isInactive ? '#dc2626' : '#15803d',
              fontWeight: 600,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'
            }}>
              {isInactive ? '!' : '✓'}
            </Box>
            <Stack>
              <Typography fontWeight={600} fontSize={'1rem'} fontFamily={'Inter'} color={isInactive ? '#b91c1c' : '#065f46'}>
                {isInactive ? 'Inactive Fellowship' : 'Active Fellowship'}
              </Typography>
               <Typography fontSize={'.7rem'} fontWeight={500} color={isInactive? '#7f1d1d' : '#166534'}>
                  Current Status: {fellowship.state?.value || "Unknown"}
               </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

const DetailRow = ({ title, value }: { title: string, value: string | undefined | null }) => {
    return (
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>{title}:</Typography>
          <Typography>{value || '—'}</Typography>
        </Stack>
    )
}

const CouncilFellowshipDetail: React.FC<DetailProps> = ({ fellowship }) => {
  if (!fellowship) return <Box>Loading...</Box>;

  return (
    <Box>
        <Box sx={{
          borderRadius: 4,
          background: '#ffffff',
          p: 3,
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          width: '100%'
        }}>
          <Typography fontSize={'.75rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: 2 }}>
            Fellowship Details
          </Typography>

          <Stack gap={1.5} fontSize={'.8rem'}>
            <DetailRow title="Name" value={fellowship.name} />
            <DetailRow title="Certificate No" value={formatCertificateNumber(fellowship.certificateNo)} />
            <DetailRow title="Location Context" value={fellowship.isInEthiopia ? "In Ethiopia" : "Outside Ethiopia"} />
            <DetailRow title="Country" value={fellowship.country} />
            <DetailRow title="Region" value={typeof fellowship.region === 'object' && fellowship.region ? (fellowship.region as any).description || (fellowship.region as any).value : fellowship.region} />
            <DetailRow title="City" value={fellowship.city} />
            <DetailRow title="Phone Number" value={fellowship.phoneNumber} />
            <DetailRow title="Email" value={fellowship.email} />
            <DetailRow title="Certificate Issued" value={fellowship.certificateIssuedDate ? toEthiopianDateText(new Date(fellowship.certificateIssuedDate).toISOString()) : '—'} />
            <DetailRow title="Status" value={fellowship.state?.value} />

            {/* Board Members Section */}
            <Stack direction='row' gap={2} alignItems="flex-start" sx={{ mt: 1 }}>
              <Typography fontWeight={600} width={140} sx={{ mt: 1 }}>Board Members:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flex: 1 }}>
                {Array.isArray(fellowship.boardMembers) && fellowship.boardMembers.length > 0 ? (
                  fellowship.boardMembers.map((bm, idx) => (
                    <Box key={bm.id || idx} sx={{
                      minWidth: 180,
                      p: 2,
                      borderRadius: 2,
                      background: '#f3f4f6',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #e5e7eb',
                      mb: 1
                    }}>
                      <Typography fontWeight={600} fontSize={'.98rem'}>{bm.fullName}</Typography>
                      {bm.phoneNumber && (
                        <Typography fontSize={'.85rem'} color={'#64748b'}>{bm.phoneNumber}</Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ mt: 1 }}>—</Typography>
                )}
              </Box>
            </Stack>
          </Stack>
        </Box>
    </Box>
  );
};

export default CouncilFellowshipDetail;
