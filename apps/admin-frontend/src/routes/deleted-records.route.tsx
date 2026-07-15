
import { createFileRoute } from '@tanstack/react-router'
import DeletedMembers from '../pages/DeletedMembers'

export const Route = createFileRoute('/deleted-records')({
  component: DeletedMembers,
})
