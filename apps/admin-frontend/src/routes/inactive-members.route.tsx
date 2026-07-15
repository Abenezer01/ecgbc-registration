import { createFileRoute } from '@tanstack/react-router';
import InactiveMembers from '../pages/InactiveMembers';

export const Route = createFileRoute('/inactive-members')({
  component: InactiveMembers,
});