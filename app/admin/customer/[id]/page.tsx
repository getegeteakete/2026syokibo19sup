import { prisma } from '@/lib/db'
import { STAGES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminCustomerClient from './AdminCustomerClient'

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let user: any = null
  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: {
        hearingData: true,
        applicationStatus: true,
        chatMessages: { orderBy: { createdAt: 'desc' }, take: 20 },
      }
    })
  } catch (e) {
    console.error('Customer page DB error:', e)
    // テーブルが未作成の可能性 — エラーページを出さずに空データで表示
  }

  if (!user || user.role !== 'customer') notFound()

  // tokenUsageは別途安全に集計
  let totalTokens = 0
  try {
    const agg = await prisma.tokenUsage.aggregate({
      where: { userId: id },
      _sum: { inputTokens: true, outputTokens: true },
    })
    totalTokens = (agg._sum.inputTokens || 0) + (agg._sum.outputTokens || 0)
  } catch (_) {}

  const stage = user.applicationStatus?.stage || 'requirement_check'
  const stageIndex = STAGES.findIndex((s: any) => s.id === stage)

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Noto Sans JP',sans-serif", minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '20px' }}>
        <Link href="/admin" style={{ color: '#7a8f80', textDecoration: 'none' }}>管理</Link>
        <span style={{ color: '#c5d4c8' }}>/</span>
        <Link href="/admin/users" style={{ color: '#7a8f80', textDecoration: 'none' }}>顧客一覧</Link>
        <span style={{ color: '#c5d4c8' }}>/</span>
        <span style={{ color: '#1b3a28', fontWeight: 600 }}>{user.companyName || user.username}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          width: '52px', height: '52px', background: '#e8f5ee', borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 800, color: '#2d6a4f', flexShrink: 0
        }}>
          {(user.companyName || user.username).slice(0, 1)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1b3a28', margin: 0 }}>
            {user.companyName || '(会社名未設定)'}
          </h1>
          <p style={{ fontSize: '12px', color: '#7a8f80', marginTop: '3px' }}>
            @{user.username}　{user.email ? `｜ ${user.email}` : ''}　{user.phone ? `｜ ${user.phone}` : ''}
          </p>
        </div>
        <span style={{
          fontSize: '12px', padding: '5px 14px', borderRadius: '20px', fontWeight: 600,
          background: user.applicationStatus?.adopted ? '#e8f5ee' : '#f4f7f4',
          color: user.applicationStatus?.adopted ? '#2d6a4f' : '#5a7060'
        }}>
          {STAGES[stageIndex]?.label || '未設定'}
        </span>
      </div>

      <AdminCustomerClient
        user={{ ...user, totalTokens }}
        stages={STAGES}
        stageIndex={stageIndex}
      />
    </div>
  )
}
