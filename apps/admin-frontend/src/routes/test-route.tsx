import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test-route')({
  component: TestRoute,
})

function TestRoute() {
  return <div>Test Route Content</div>
}