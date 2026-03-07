import { prisma } from '@/lib/db'
import { STAGES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminCustomerClient from './AdminCustomerClient'

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      hearingData: true,
      applicationStatus: true,
      tokenUsage: { select: { inputTokens: true, outputTokens: true, date: true } },
      chatMessages: { orderBy: { createdAt: 'desc' }, take: 20 },
    }
  })

  if (!user || user.role !== 'customer') notFound()

  const totalTokens = user.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
  const stage = user.applicationStatus?.stage || 'requirement_check'
  const stageIndex = STAGES.findIndex(s => s.id === stage)

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500 hover:text-primary-600">管理</Link>
        <span className="text-slate-300">/</span>
        <Link href="/admin/users" className="text-slate-500 hover:text-primary-600">顧客一覧</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium">{user.companyName || user.username}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-2xl">
          {(user.companyName || user.username).slice(0, 1)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{user.companyName || '(会社名未設定)'}</h1>
          <p className="text-slate-500 text-sm">ID: {user.username} | {user.email || 'メール未設定'}</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            user.applicationStatus?.adopted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {STAGES[stageIndex]?.icon} {STAGES[stageIndex]?.label}
          </span>
        </div>
      </div>

      {/* Pass to client component for interactive parts */}
      <AdminCustomerClient
        user={{ ...user, password: undefined as unknown as string, totalTokens }}
        stages={STAGES}
        stageIndex={stageIndex}
      />
    </div>
  )
}
