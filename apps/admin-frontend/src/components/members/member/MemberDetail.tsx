import React from "react";
import {
  Box,
  Stack,
  Typography
} from "@mui/material";
import { Member } from "../../../types/model/member.model";
import { toEthiopianDateText } from '../../../utils/ethiopian-date.util';
import { formatCertificateNumber } from '../../../utils/memberUtils';
import { CommonObjectState } from "../../../enums/common-object-state.enum";

interface MemberDetailProps {
  member: Member;
}

export const MemberStatusBanner: React.FC<MemberDetailProps> = ({ member }) => {
  if (!member) return <>Couldn't load member</>;
  const memberStateValue = member.state?.value ?? (member.isActive ? CommonObjectState.ACTIVE : CommonObjectState.IN_ACTIVE);
  const isInactive = memberStateValue === CommonObjectState.IN_ACTIVE;

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
                {isInactive ? 'Inactive Member' : 'Active Member'}
              </Typography>
              {member.reasonForInactive && isInactive && (
                <Typography fontSize={'.7rem'} fontWeight={500} color={'#7f1d1d'}>
                  Reason: {member.reasonForInactive}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

const MemberDetail: React.FC<MemberDetailProps> = ({ member }) => {
  if (!member) return <>Couldn't load member</>;
  return (
    <Box sx={{
      borderRadius: 4,
      background: '#ffffff',
      p: 3,
      boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      width: '100%'
    }}>
      <Typography fontSize={'.75rem'} fontWeight={600} letterSpacing={1} textTransform={'uppercase'} sx={{ opacity: .55, mb: 2 }}>Member Details</Typography>
      <Stack gap={1.5} fontSize={'.8rem'}>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Certificate No:</Typography>
          <Typography>{formatCertificateNumber(member.certificateNo)}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Name:</Typography>
          <Typography>{member.name || '—'}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Institution Type:</Typography>
          <Typography>{member.type?.value || (typeof member.type === 'string' ? member.type : '—')}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Country:</Typography>
          <Typography>{typeof member.country === 'object' ? (member.country?.value || '—') : (member.country || '—')}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Region:</Typography>
          <Typography>{
            typeof member.region === 'object' && member.region !== null
              ? ('value' in member.region ? member.region.value || '—' : '—')
              : (member.region || '—')
          }</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>City:</Typography>
          <Typography>{typeof member.city === 'object' ? (member.city?.value || '—') : (member.city || '—')}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Phone Number:</Typography>
          <Typography>{member.phoneNumber || '—'}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Email:</Typography>
          <Typography>{member.email || '—'}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Certificate Issued Date:</Typography>
          <Typography>{member.certificateIssuedDate ? toEthiopianDateText(new Date(member.certificateIssuedDate).toISOString()) : '—'}</Typography>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Status:</Typography>
          <Typography>{member.state?.value || (typeof member.state === 'string' ? member.state : '—')}</Typography>
        </Stack>
        {/* Board Members modern card layout */}
        <Stack direction='row' gap={2} alignItems="flex-start">
          <Typography fontWeight={600} width={140} sx={{mt:1}}>Board Members:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Array.isArray(member.boardMembers) && member.boardMembers.length > 0 ? (
              member.boardMembers.map((bm, idx) => (
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
              <Typography sx={{mt:1}}>—</Typography>
            )}
          </Box>
        </Stack>
        <Stack direction='row' gap={2}>
          <Typography fontWeight={600} width={140}>Council Fellowship:</Typography>
          <Typography>
            {member.councilFellowship?.name || (typeof member.councilFellowship === 'string' ? member.councilFellowship : '—')}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MemberDetail;