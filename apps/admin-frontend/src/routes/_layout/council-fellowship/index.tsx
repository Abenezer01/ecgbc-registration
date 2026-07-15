import { Box } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import CouncilFellowships from '../../../components/councilFellowship/CouncilFellowships'

export const Route = createFileRoute('/_layout/council-fellowship/')({
  component: () => <Page />,
})

const Page = () => {
    return (<Box sx={{px:10,py:5}}>
        <CouncilFellowships />
    </Box>)
}