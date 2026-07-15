import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[50],
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
    fontFamily: 'Inter',
    letterSpacing: '.25px',
    fontSize: 13.5,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  cursor: 'pointer',
  border: '1px solid rgba(2, 6, 23, 0.05)',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
  borderRadius: 10,
  backgroundColor: 'white',
  transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.action.hover,
    boxShadow: '0 8px 28px rgba(16, 24, 40, 0.10)',
    transform: 'translateY(-2px)'
  },
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.mode === 'light' ? '#FBFCFD' : theme.palette.background.default,
  },
  '& td:first-of-type': { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  '& td:last-of-type': { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
}));

export default StyledTableRow