import { Box, Skeleton } from "@mui/material";
import StyledTableRow, { StyledTableCell } from "./TableComponents";

export const ProfileDetailLoading = () => (
  <Box sx={{ width: 560, display: "flex", flexDirection: "column", gap: 2 }}>
    <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
      <Skeleton
        variant="rectangular"
        width={"50%"}
        height={40}
        sx={{ borderRadius: 2 }}
      />
      <Skeleton
        variant="rectangular"
        width={"50%"}
        height={40}
        sx={{ borderRadius: 2 }}
      />
    </Box>
    <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
      <Skeleton
        variant="rectangular"
        width={"50%"}
        height={40}
        sx={{ borderRadius: 2 }}
      />
      <Skeleton
        variant="rectangular"
        width={"50%"}
        height={40}
        sx={{ borderRadius: 2 }}
      />
    </Box>
  </Box>
);

export const TableCellLoading = () => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
    <Skeleton
      variant="rectangular"
      width={"100%"}
      height={32}
      sx={{ borderRadius: 2 }}
    />
  </Box>
);
export const DashboardStatLoading = () => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "row", gap: 2 }}>
    <Skeleton
      variant="rectangular"
      width={"100%"}
      height={200}
      sx={{ borderRadius: 2 }}
    />
    <Skeleton
      variant="rectangular"
      width={"100%"}
      height={200}
      sx={{ borderRadius: 2 }}
    />
    <Skeleton
      variant="rectangular"
      width={"100%"}
      height={200}
      sx={{ borderRadius: 2 }}
    />
  </Box>
);

export const MembersTableLoading = () => (
  <>
    <StyledTableRow>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
    </StyledTableRow>
    <StyledTableRow>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
      <StyledTableCell align="left">
        <TableCellLoading />
      </StyledTableCell>
    </StyledTableRow>
  </>
);
