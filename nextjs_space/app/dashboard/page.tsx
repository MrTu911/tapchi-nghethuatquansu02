
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRoleDashboard } from '@/lib/role-dashboard'

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Điều hướng tới dashboard mặc định theo vai trò (SSOT: lib/role-dashboard.ts).
  redirect(getRoleDashboard(session.role))
}
