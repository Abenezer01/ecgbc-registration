import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to /dashboard.
 * The middleware handles auth; if unauthenticated it will redirect to /login first.
 */
export default function RootPage() {
  redirect("/dashboard");
}
