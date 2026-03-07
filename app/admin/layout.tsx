import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  return (
    <div style={{display:'flex', height:'100vh', overflow:'hidden', background:'#f4f7f4', fontFamily:"'Noto Sans JP',sans-serif"}}>
      <AdminNav />
      <main style={{flex:1, overflowY:'auto', minWidth:0}}>
        {children}
      </main>
    </div>
  )
}
