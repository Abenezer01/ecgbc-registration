import { Box, Stack, Typography } from "@mui/material";
import WarningIcon from "../../../assets/warning.svg";
import React from "react";
interface ReportWarningProps {
  notReportedYears: number[];
}

function formatYearRanges(years: number[], maxSegments = 8): string {
  if (!years || years.length === 0) return "";
  const sorted = [...years].sort((a, b) => a - b);
  const ranges: Array<[number, number]> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const y = sorted[i];
    if (y === prev + 1) {
      prev = y;
    } else {
      ranges.push([start, prev]);
      start = y;
      prev = y;
    }
  }
  ranges.push([start, prev]);
  const segments = ranges.map(([s, e]) => (s === e ? `${s}` : `${s}-${e}`));
  const shown = segments.slice(0, maxSegments);
  const remaining = segments.length - shown.length;
  return remaining > 0 ? `${shown.join(", ")} and ${remaining} more` : shown.join(", ");
}

const ReportWarning: React.FC<ReportWarningProps> = ({ notReportedYears }) => {
  const compactText = formatYearRanges(notReportedYears);
  return (
    <Box
      sx={{
        my: 1,
        p: 2,
        bgcolor: "#DCB02B1A",
        border: `1px solid #DCB02B`,
        borderRadius: 1,
      }}
    >
      <Stack direction={"row"} width={"100%"} alignItems={"center"} gap={2}>
        <Box component={"img"} src={WarningIcon} />
        <Typography color="#7C7C7C" fontWeight={200} fontSize={"1rem"} sx={{ overflowWrap: "anywhere" }}>
          This member has not reported{" "}
          <Box component={"span"} sx={{ fontWeight: 600 }}>
            {compactText}
          </Box>{" "}
          yearly reports.
        </Typography>
      </Stack>
    </Box>
  );
};

export default ReportWarning;
