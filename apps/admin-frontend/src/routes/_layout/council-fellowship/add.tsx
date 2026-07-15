import { createFileRoute } from "@tanstack/react-router";
import { Box } from "@mui/material";

export const Route = createFileRoute("/_layout/council-fellowship/add")({
  component: () => <Page />,
});

const Page = () => {
  return <Box sx={{ px: 10, py: 5 }}>{/* <CreateFellowship /> */}</Box>;
};
