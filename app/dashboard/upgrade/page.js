import { redirect } from 'next/navigation'

export default function UpgradeRedirect() {
  // Server-side redirect for legacy route
  redirect('/dashboard')
}