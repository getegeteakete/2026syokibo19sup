import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'admin') redirect('/admin')

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f4f7f4', fontFamily:"'Noto Sans JP',sans-serif" }}>
      <DashboardNav session={session} />
      <main style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
