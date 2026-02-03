import { redirect } from 'next/navigation'

// This page redirects to teacher portal by default
// In a real app, this would check the user's role and redirect accordingly
export default function DashboardPage() {
  redirect('/dashboard/teacher')
}
