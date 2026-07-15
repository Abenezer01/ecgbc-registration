import { Box } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import AddMember from '../../../components/members/AddMember'

export const Route = createFileRoute('/_layout/members/add')({
  component: () => <Page />,
})
 
const Page = ()=>{
  return(<Box sx={{px:10,py:5}}>
    <AddMember />
  </Box>)
}