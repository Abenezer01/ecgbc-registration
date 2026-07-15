import { Box } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import Members from '../../../components/members/Members'

export const Route = createFileRoute('/_layout/members/')({
  component: () => <Page />,
})

const Page = ()=> {
    return(
        <Box>
            <Members />
        </Box>
    )
}