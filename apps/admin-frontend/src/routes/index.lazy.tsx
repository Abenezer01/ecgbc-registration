import { createLazyFileRoute } from '@tanstack/react-router'
import Login from '../components/auth/Login'

export const Route = createLazyFileRoute('/')({
  component: ()=> <Login /> ,
})

