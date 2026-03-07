'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// 型定義
// ============================================================
interface AppData {
  // 様式1 基本情報
  companyType: string
  companyName: string
  companyNameKana: string
  representativeName: string
  address: string
  phone: string
  email: string
  website: string
  hasWebsite: string
  businessType: string
  employeeCount: string
  foundingYear: string
  capitalAmount: string
  annualSalesLatest: string
  // 様式2 経営計画
  businessOverview: string
  marketAnalysis: string
  strengths: string
  challenges: string
  managementPolicy: string
  // 様式3-1 補助事業計画
  subsidyTitle: string
  subsidyBackground: string
  subsidyContent: string
  expectedEffect: string
  // 様式3-2 経費明細
  expenses: ExpenseRow[]
  totalExpense: number
  subsidyAmount: number
  ownFunding: string
  // 特例
  invoiceSpecial: string
  wageSpecial: string
  // 宣誓
  declaration: boolean
}

interface ExpenseRow {
  id: string
  category: string
  description: string
  quantity: string
  unitPrice: string
  amount: number
  vendor: string
}

const STEPS = [
  { id: 1, label: 'ログイン確認', icon: '🔐', short: 'ログイン' },
  { id: 2, label: '応募者情報入力', icon: '🏢', short: '基本情報' },
  { id: 3, label: '経営計画書入力', icon: '📝', short: '経営計画' },
  { id: 4, label: '補助事業計画入力', icon: '🎯', short: '事業計画' },
  { id: 5, label: '経費明細入力', icon: '💰', short: '経費' },
  { id: 6, label: '書類添付', icon: '📎', short: '書類添付' },
  { id: 7, label: '確認・送信', icon: '🚀', short: '送信' },
]

const EXPENSE_CATEGORIES = [
  '広告費', '展示会等出展費', '旅費', '開発費', '資料購入費',
  '雑役務費', '借料', '設備処分費', '委託費', '外注費',
]

const DOCUMENTS = [
  { id: 'style4', label: '様式4 事業支援計画書（PDF）', required: true, hint: '商工会議所から受け取ったPDFをアップロード' },
  { id: 'kakutei', label: '確定申告書（PDF）', required: true, hint: '直近1期分（個人:白色/青色申告書、法人:法人税申告書）' },
  { id: 'meibo', label: '従業員名簿', required: false, hint: '常時使用する従業員がいる場合' },
  { id: 'invoice', label: 'インボイス登録通知書', required: false, hint: 'インボイス特例を申請する場合' },
  { id: 'wage', label: '賃金台帳の写し', required: false, hint: '賃金引上げ特例を申請する場合' },
]

// ============================================================
// メインコンポーネント
// ============================================================
export default function SimulationPage() {
  const [step, setStep] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<AppData>({
    companyType: '個人事業主',
    companyName: '', companyNameKana: '', representativeName: '',
    address: '', phone: '', email: '', website: '', hasWebsite: 'なし',
    businessType: '', employeeCount: '', foundingYear: '',
    capitalAmount: '', annualSalesLatest: '',
    businessOverview: '', marketAnalysis: '', strengths: '',
    challenges: '', managementPolicy: '',
    subsidyTitle: '', subsidyBackground: '', subsidyContent: '', expectedEffect: '',
    expenses: [], totalExpense: 0, subsidyAmount: 0, ownFunding: '',
    invoiceSpecial: 'なし', wageSpecial: 'なし',
    declaration: false,
  })
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [aiTip, setAiTip] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([])

  // Pre-fill from hearing data
  useEffect(() => {
    fetch('/api/hearing').then(r => r.json()).then(({ data: h }) => {
      if (!h) return
      setData(prev => ({
        ...prev,
        companyName: h.companyName || '',
        representativeName: h.representativeName || '',
        address: h.address || '',
        phone: h.phone || '',
        email: h.email || '',
        businessType: h.businessType || '',
        employeeCount: h.employeeCount?.replace('人', '').replace(/[^0-9]/g, '') || '',
        annualSalesLatest: h.annualSales || '',
        businessOverview: h.currentBusiness || '',
        strengths: h.strengths || '',
        challenges: h.challenges || '',
        subsidyTitle: h.subsidyPurpose?.slice(0, 30) || '',
        subsidyBackground: h.subsidyPurpose || '',
        subsidyContent: h.plannedActivities || '',
        expectedEffect: h.expectedEffects || '',
      }))
    })
  }, [])

  const update = (field: keyof AppData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const addExpense = () => {
    const newRow: ExpenseRow = {
      id: Date.now().toString(),
      category: '', description: '', quantity: '1', unitPrice: '', amount: 0, vendor: '',
    }
    setData(prev => ({ ...prev, expenses: [...prev.expenses, newRow] }))
  }

  const updateExpense = (id: string, field: keyof ExpenseRow, value: string) => {
    setData(prev => {
      const expenses = prev.expenses.map(e => {
        if (e.id !== id) return e
        const updated = { ...e, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = parseInt(updated.quantity || '0') * parseInt(updated.unitPrice?.replace(/[^0-9]/g, '') || '0')
        }
        return updated
      })
      const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const subsidyAmount = Math.min(Math.floor(totalExpense * 2 / 3), 500000)
      return { ...prev, expenses, totalExpense, subsidyAmount }
    })
  }

  const removeExpense = (id: string) => {
    setData(prev => {
      const expenses = prev.expenses.filter(e => e.id !== id)
      const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const subsidyAmount = Math.min(Math.floor(totalExpense * 2 / 3), 500000)
      return { ...prev, expenses, totalExpense, subsidyAmount }
    })
  }

  // AI assistant for this screen
  const askAI = async () => {
    if (!aiInput.trim()) return
    const userMsg = aiInput
    setAiInput('')
    setAiLoading(true)
    const newMsgs = [...aiMessages, { role: 'user', content: userMsg }]
    setAiMessages(newMsgs)

    try {
      const form = new FormData()
      form.append('message', userMsg)
      form.append('section', 'guide')
      form.append('history', JSON.stringify(newMsgs.slice(-6)))
      const res = await fetch('/api/chat', { method: 'POST', body: form })
      const json = await res.json()
      setAiMessages([...newMsgs, { role: 'assistant', content: json.message || 'エラーが発生しました' }])
    } catch {
      setAiMessages([...newMsgs, { role: 'assistant', content: '通信エラーが発生しました' }])
    } finally {
      setAiLoading(false)
    }
  }

  // Field tips
  const FIELD_TIPS: Record<string, string> = {
    businessOverview: '主な事業内容・提供サービス・商品を具体的に記載。「何を」「誰に」「どうやって」提供しているかを説明してください。',
    strengths: '他社と差別化できる強みを3〜5点挙げてください。技術力・地域密着・実績・価格等を具体的に。',
    challenges: '現在直面している課題を率直に記載。売上低迷・顧客獲得・後継者・設備老朽化など。',
    managementPolicy: '3〜5年後の目標と達成方法を記載。数値目標（売上・顧客数等）があると評価が高まります。',
    subsidyTitle: '補助事業の内容が一目でわかる短いタイトル（例：SNSを活用した新規顧客獲得事業）',
    subsidyContent: '誰に・何を・どのような方法で・いつ実施するかを具体的に記載。実施スケジュールも含めてください。',
    expectedEffect: '売上増加の見込み額・新規顧客獲得数・業務効率化の割合など、数値で示せると採択率が上がります。',
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">シミュレーション完了！</h1>
        <p className="text-slate-600 mb-2">電子申請の流れを一通り体験できました。</p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left w-full mb-6">
          <p className="font-semibold text-green-800 mb-3">✅ 本番申請前のチェックポイント</p>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-start gap-2"><span>1.</span>GビズIDプライムでログインできることを確認</li>
            <li className="flex items-start gap-2"><span>2.</span>様式4（商工会議所から取得）をPDF化して手元に準備</li>
            <li className="flex items-start gap-2"><span>3.</span>確定申告書を全ページスキャンしてPDF化</li>
            <li className="flex items-start gap-2"><span>4.</span>各入力項目を下書きとして用意してから入力開始</li>
            <li className="flex items-start gap-2"><span>5.</span>締切直前は混み合うため余裕をもって申請</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setSubmitted(false); setStep(1) }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm">
            もう一度練習
          </button>
          <a href="https://www.jizokukanb.com/jizokuka_r6h/oubo.php"
            target="_blank" rel="noreferrer"
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-medium text-sm shadow-md">
            本番申請システムへ →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      {/* Top header - simulating the real system */}
      <div className="shrink-0 bg-[#003087] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
            <span className="text-[#003087] text-xs font-black">補</span>
          </div>
          <div>
            <p className="text-xs text-blue-200">小規模事業者持続化補助金＜一般型＞</p>
            <p className="text-sm font-bold">電子申請システム シミュレーション</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded font-bold">SIMULATION</span>
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
          >
            🤖 AIサポート
          </button>
        </div>
      </div>

      <div style={{display:"flex",flex:1}}>
        {/* Main form area */}
        <div ref={containerRef} style={{flex:1}}>
          {/* Step indicator */}
          <div className="bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex gap-1 overflow-x-auto">
              {STEPS.map(s => (
                <button key={s.id} onClick={() => s.id < step ? setStep(s.id) : undefined}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    s.id === step ? 'bg-[#003087] text-white' :
                    s.id < step ? 'bg-green-100 text-green-700 cursor-pointer' :
                    'bg-slate-100 text-slate-400 cursor-default'
                  }`}>
                  {s.id < step ? '✓' : s.icon}
                  <span className="hidden sm:inline">{s.short}</span>
                  <span className="sm:hidden">{s.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-3xl">
            {/* STEP 1: Login confirmation */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-blue-900 mb-3">🔐 STEP 1: GビズIDでのログイン確認</h2>
                  <p className="text-sm text-blue-800 mb-4">
                    実際の申請では、まずGビズIDプライムでログインします。
                    ここでは練習のため、ログイン済みとして進めます。
                  </p>
                  <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="text-2xl">🆔</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">GビズIDプライム アカウント</p>
                        <p className="text-xs text-green-600 font-medium">✅ ログイン済み（シミュレーション）</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>📌 実際の申請時の注意事項：</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>GビズIDエントリーや暫定プライムでは申請できません</li>
                        <li>GビズIDメンバーの場合、プライムからJグランツ利用設定が必要です</li>
                        <li>ブラウザはChrome最新版を推奨</li>
                        <li>ポップアップブロックを解除してください</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-800">
                      ⚠️ 本番URL: <code className="bg-amber-100 px-1 rounded">https://www.jizokukanb.com/jizokuka_r6h/oubo.php</code>
                      <br/>申請画面の「受付締切回」から「第19回」を選択してログインしてください。
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">GビズID情報（自動反映される項目）</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: '法人名/屋号', value: data.companyName || '（ヒアリングデータから）', locked: true },
                      { label: '代表者名', value: data.representativeName || '（ヒアリングデータから）', locked: true },
                      { label: '法人番号', value: '（GビズIDから自動反映）', locked: true },
                    ].map(f => (
                      <div key={f.label} className={`p-2 rounded-lg ${f.locked ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                        <p className="text-xs text-slate-500">{f.label} {f.locked && '🔒'}</p>
                        <p className="text-slate-700 font-medium">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">🟡 黄色背景の項目はGビズIDから自動反映され、ここでは編集できません</p>
                </div>
              </div>
            )}

            {/* STEP 2: Basic info (様式1・様式2前半) */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">🏢 STEP 2: 応募者概要入力（様式2）</h2>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-semibold text-slate-700 text-sm border-b pb-2">① 事業者基本情報</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormField label="法人・個人の別" required>
                      <select value={data.companyType} onChange={e => update('companyType', e.target.value)}
                        className="form-select">
                        <option>個人事業主</option>
                        <option>法人（株式会社等）</option>
                        <option>NPO法人</option>
                      </select>
                    </FormField>
                    <FormField label="屋号・会社名" required>
                      <input type="text" value={data.companyName} onChange={e => update('companyName', e.target.value)}
                        placeholder="例: ○○商店" className="form-input" />
                    </FormField>
                    <FormField label="屋号・会社名（フリガナ）" required>
                      <input type="text" value={data.companyNameKana} onChange={e => update('companyNameKana', e.target.value)}
                        placeholder="例: マルマルショウテン" className="form-input" />
                    </FormField>
                    <FormField label="代表者名" required>
                      <input type="text" value={data.representativeName} onChange={e => update('representativeName', e.target.value)}
                        placeholder="例: 山田 太郎" className="form-input" />
                    </FormField>
                    <FormField label="所在地" required className="sm:col-span-2">
                      <input type="text" value={data.address} onChange={e => update('address', e.target.value)}
                        placeholder="例: 東京都渋谷区○○1-2-3" className="form-input" />
                    </FormField>
                    <FormField label="電話番号" required>
                      <input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)}
                        placeholder="例: 03-1234-5678" className="form-input" />
                    </FormField>
                    <FormField label="メールアドレス" required>
                      <input type="email" value={data.email} onChange={e => update('email', e.target.value)}
                        placeholder="example@email.com" className="form-input" />
                    </FormField>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-semibold text-slate-700 text-sm border-b pb-2">② 事業概要</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormField label="業種" required>
                      <select value={data.businessType} onChange={e => update('businessType', e.target.value)}
                        className="form-select">
                        <option value="">選択してください</option>
                        <option>小売業</option>
                        <option>宿泊業・娯楽業</option>
                        <option>サービス業（宿泊業、娯楽業除く）</option>
                        <option>製造業、その他</option>
                      </select>
                    </FormField>
                    <FormField label="常時使用する従業員数" required>
                      <input type="number" value={data.employeeCount} onChange={e => update('employeeCount', e.target.value)}
                        placeholder="0" min="0" max="20" className="form-input" />
                      <p className="text-xs text-slate-400 mt-1">代表者本人は含めない。小売業等は5人以下が要件</p>
                    </FormField>
                    <FormField label="創業年">
                      <input type="text" value={data.foundingYear} onChange={e => update('foundingYear', e.target.value)}
                        placeholder="例: 2010年" className="form-input" />
                    </FormField>
                    <FormField label="直近1期の売上高（円）" required>
                      <input type="text" value={data.annualSalesLatest} onChange={e => update('annualSalesLatest', e.target.value)}
                        placeholder="例: 12000000" className="form-input" />
                    </FormField>
                    <FormField label="自社ホームページ" className="sm:col-span-2">
                      <div className="flex gap-2 mb-2">
                        {['なし', 'あり'].map(v => (
                          <label key={v} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" value={v} checked={data.hasWebsite === v}
                              onChange={e => update('hasWebsite', e.target.value)} />
                            <span className="text-sm">{v}</span>
                          </label>
                        ))}
                      </div>
                      {data.hasWebsite === 'あり' && (
                        <input type="url" value={data.website} onChange={e => update('website', e.target.value)}
                          placeholder="https://example.com" className="form-input" />
                      )}
                    </FormField>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h3 className="font-semibold text-slate-700 text-sm border-b pb-2">③ 特例の選択</h3>
                  <div className="space-y-3">
                    <FormField label="インボイス特例の希望">
                      <select value={data.invoiceSpecial} onChange={e => update('invoiceSpecial', e.target.value)}
                        className="form-select">
                        <option value="なし">希望しない</option>
                        <option value="あり">希望する（免税事業者で適格請求書発行事業者の登録が完了している場合）</option>
                      </select>
                      {data.invoiceSpecial === 'あり' && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                          📎 インボイス登録通知書の写しを後ほど添付する必要があります
                        </div>
                      )}
                    </FormField>
                    <FormField label="賃金引上げ特例の希望">
                      <select value={data.wageSpecial} onChange={e => update('wageSpecial', e.target.value)}
                        className="form-select">
                        <option value="なし">希望しない</option>
                        <option value="あり">希望する（賃上げ計画がある場合）</option>
                      </select>
                      {data.wageSpecial === 'あり' && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                          📎 直近1ヶ月の賃金台帳の写しを後ほど添付する必要があります
                        </div>
                      )}
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: 経営計画 */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">📝 STEP 3: 経営計画書入力（様式2）</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  💡 この項目は審査の重要ポイントです。具体的な数字・実例を交えて入力してください。
                </div>

                {[
                  { key: 'businessOverview', label: '事業概要（自社および取り扱う商品・サービスについて）', rows: 4,
                    hint: '主な事業内容・提供サービス・商品を具体的に記載。「何を」「誰に」「どうやって」提供しているかを説明してください。' },
                  { key: 'marketAnalysis', label: '自社の市場・競合・顧客の状況', rows: 4,
                    hint: 'どのような市場で事業を行っているか、主な競合はどこか、顧客の特徴を記載してください。' },
                  { key: 'strengths', label: '自社の強み（他社との差別化ポイント）', rows: 4,
                    hint: '他社と差別化できる強みを3〜5点挙げてください。技術力・地域密着・実績・価格等を具体的に。' },
                  { key: 'challenges', label: '経営上の課題・問題点', rows: 3,
                    hint: '現在直面している課題を率直に記載。売上低迷・顧客獲得・後継者・設備老朽化など。' },
                  { key: 'managementPolicy', label: '経営方針・目標（今後の方向性と具体的な目標）', rows: 4,
                    hint: '3〜5年後の目標と達成方法を記載。数値目標（売上・顧客数等）があると評価が高まります。' },
                ].map(field => (
                  <div key={field.key} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {field.label} <span className="text-red-500">*</span>
                    </label>
                    {FIELD_TIPS[field.key] && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-700 mb-2">
                        💡 {FIELD_TIPS[field.key]}
                      </div>
                    )}
                    <textarea
                      value={data[field.key as keyof AppData] as string}
                      onChange={e => update(field.key as keyof AppData, e.target.value)}
                      rows={field.rows}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">
                      {(data[field.key as keyof AppData] as string || '').length} 文字
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4: 補助事業計画 */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">🎯 STEP 4: 補助事業計画入力（様式3-1）</h2>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                  ✅ ここが採択の核心です。「何をするか」「なぜするか」「どんな効果があるか」を具体的に書いてください。
                </div>

                {[
                  { key: 'subsidyTitle', label: '補助事業名（タイトル）', rows: 1,
                    hint: '補助事業の内容が一目でわかる短いタイトル（例：SNSを活用した新規顧客獲得事業）' },
                  { key: 'subsidyBackground', label: '補助事業の背景・必要性', rows: 4,
                    hint: 'なぜこの取組が必要か。現状の課題・機会を踏まえて記載してください。' },
                  { key: 'subsidyContent', label: '補助事業の内容（具体的な取組）', rows: 6,
                    hint: '誰に・何を・どのような方法で・いつ実施するかを具体的に記載。実施スケジュールも含めてください。' },
                  { key: 'expectedEffect', label: '期待される効果・成果目標', rows: 4,
                    hint: '売上増加の見込み額・新規顧客獲得数・業務効率化の割合など、数値で示せると採択率が上がります。' },
                ].map(field => (
                  <div key={field.key} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {field.label} <span className="text-red-500">*</span>
                    </label>
                    {FIELD_TIPS[field.key] && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-xs text-green-700 mb-2">
                        💡 {FIELD_TIPS[field.key]}
                      </div>
                    )}
                    <textarea
                      value={data[field.key as keyof AppData] as string}
                      onChange={e => update(field.key as keyof AppData, e.target.value)}
                      rows={field.rows}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:bg-white resize-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 5: 経費明細 */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">💰 STEP 5: 経費明細入力（様式3-2）</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  ⚠️ 補助対象経費のみ入力。各経費は実際の見積書・領収書と一致させてください。
                </div>

                {data.expenses.map((exp, idx) => (
                  <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">経費 {idx + 1}</span>
                      <button onClick={() => removeExpense(exp.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded">
                        削除
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <FormField label="経費区分" required>
                        <select value={exp.category}
                          onChange={e => updateExpense(exp.id, 'category', e.target.value)}
                          className="form-select">
                          <option value="">選択</option>
                          {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </FormField>
                      <FormField label="品名・内容" required>
                        <input type="text" value={exp.description}
                          onChange={e => updateExpense(exp.id, 'description', e.target.value)}
                          placeholder="例: チラシ制作費（A4・500部）" className="form-input" />
                      </FormField>
                      <FormField label="数量">
                        <input type="number" value={exp.quantity}
                          onChange={e => updateExpense(exp.id, 'quantity', e.target.value)}
                          min="1" className="form-input" />
                      </FormField>
                      <FormField label="単価（円）" required>
                        <input type="text" value={exp.unitPrice}
                          onChange={e => updateExpense(exp.id, 'unitPrice', e.target.value)}
                          placeholder="例: 50000" className="form-input" />
                      </FormField>
                      <FormField label="金額（円）（自動計算）">
                        <div className="form-input bg-slate-100 text-slate-600 font-mono">
                          {exp.amount.toLocaleString()}
                        </div>
                      </FormField>
                      <FormField label="発注先・業者名">
                        <input type="text" value={exp.vendor}
                          onChange={e => updateExpense(exp.id, 'vendor', e.target.value)}
                          placeholder="例: 株式会社○○印刷" className="form-input" />
                      </FormField>
                    </div>
                  </div>
                ))}

                <button onClick={addExpense}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all text-sm font-medium">
                  ＋ 経費を追加
                </button>

                {/* Summary */}
                {data.expenses.length > 0 && (
                  <div className="bg-gradient-to-br from-primary-50 to-green-50 border border-primary-200 rounded-2xl p-5">
                    <h3 className="font-semibold text-slate-800 mb-4">💹 補助金額試算</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-slate-500">補助対象経費合計</p>
                        <p className="text-lg font-bold text-slate-800">{data.totalExpense.toLocaleString()}円</p>
                      </div>
                      <div className="bg-primary-600 text-white rounded-xl p-3 shadow-md">
                        <p className="text-xs text-primary-200">補助金額（上限50万）</p>
                        <p className="text-lg font-bold">{data.subsidyAmount.toLocaleString()}円</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-slate-500">自己負担額</p>
                        <p className="text-lg font-bold text-amber-600">{(data.totalExpense - data.subsidyAmount).toLocaleString()}円</p>
                      </div>
                    </div>
                    {data.totalExpense > 750000 && (
                      <p className="text-xs text-amber-700 mt-3 text-center">
                        ⚠️ 補助対象経費が75万円を超えています。補助上限50万円が適用されます。
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <FormField label="資金調達方法（自己負担分）" required>
                    <textarea value={data.ownFunding} onChange={e => update('ownFunding', e.target.value)}
                      rows={2} placeholder="例: 自己資金（預貯金）より充当"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white resize-none" />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 6: 書類添付 */}
            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">📎 STEP 6: 書類添付</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                  ⚠️ 書類の不備・不足があると審査対象外になります。チェックリストで確認してから添付してください。
                </div>

                <div className="space-y-3">
                  {DOCUMENTS.map(doc => (
                    <div key={doc.id} className={`bg-white rounded-2xl border p-4 transition-all ${
                      uploadedDocs[doc.id] ? 'border-green-300 bg-green-50' : 'border-slate-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                          uploadedDocs[doc.id] ? 'bg-green-500 text-white' :
                          doc.required ? 'bg-red-100 text-red-600 border border-red-300' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {uploadedDocs[doc.id] ? '✓' : doc.required ? '!' : '○'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-slate-800">{doc.label}</span>
                            {doc.required && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">必須</span>}
                          </div>
                          <p className="text-xs text-slate-500">{doc.hint}</p>
                          {uploadedDocs[doc.id] && (
                            <p className="text-xs text-green-600 mt-1">✅ {uploadedDocs[doc.id]}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setUploadedDocs(p => ({
                            ...p,
                            [doc.id]: uploadedDocs[doc.id] ? '' : `${doc.label.split('（')[0]}.pdf`,
                          }))}
                          className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            uploadedDocs[doc.id]
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                          }`}
                        >
                          {uploadedDocs[doc.id] ? '削除' : '選択（模擬）'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                  <p className="font-medium mb-1">📝 添付ファイルの注意事項</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>ファイル形式はPDFを推奨</li>
                    <li>1ファイルあたりの容量制限あり（5MB程度）</li>
                    <li>スキャン画像はなるべく鮮明に</li>
                    <li>様式4は商工会議所から受け取ったPDFをそのまま添付</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 7: 確認・送信 */}
            {step === 7 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">🚀 STEP 7: 最終確認・送信</h2>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h3 className="font-semibold text-slate-700 border-b pb-2">申請内容サマリー</h3>
                  {[
                    { label: '申請者', value: `${data.companyName}（${data.companyType}）` },
                    { label: '業種', value: `${data.businessType}・従業員${data.employeeCount}名` },
                    { label: '補助事業名', value: data.subsidyTitle },
                    { label: '補助対象経費', value: `${data.totalExpense.toLocaleString()}円` },
                    { label: '申請補助金額', value: `${data.subsidyAmount.toLocaleString()}円` },
                    { label: '特例', value: [data.invoiceSpecial === 'あり' && 'インボイス特例', data.wageSpecial === 'あり' && '賃金引上げ特例'].filter(Boolean).join('・') || 'なし' },
                    { label: '添付書類', value: `${Object.values(uploadedDocs).filter(Boolean).length}件` },
                  ].map(item => item.value && (
                    <div key={item.label} className="flex gap-3 text-sm">
                      <span className="text-slate-500 w-28 shrink-0">{item.label}</span>
                      <span className="text-slate-800 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Final checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-700 mb-3">✅ 最終チェックリスト</h3>
                  <div className="space-y-2">
                    {[
                      'GビズIDでログインしている',
                      '様式4（商工会議所発行）を添付した',
                      '確定申告書（直近1期分）を添付した',
                      '経営計画書の内容を確認した',
                      '補助事業計画書の内容を確認した',
                      '経費明細の金額を確認した',
                      '申請締切（4月30日17:00）前に送信する',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-green-500">☑</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 宣誓 */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={data.declaration}
                      onChange={e => update('declaration', e.target.checked)}
                      className="mt-0.5 w-5 h-5 accent-primary-500" />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      上記の申請内容が事実と相違なく、公募要領の各種要件を確認・承諾した上で申請することを宣誓します。
                      虚偽の内容を申請した場合は、補助金の返還・罰則の対象となることを了解しました。
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => data.declaration && setSubmitted(true)}
                  disabled={!data.declaration}
                  className="w-full py-4 bg-[#003087] hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold rounded-2xl text-base transition-all shadow-xl disabled:shadow-none"
                >
                  {data.declaration ? '🚀 申請を送信する（シミュレーション）' : '宣誓・同意にチェックを入れてください'}
                </button>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  ⚠️ これはシミュレーションです。実際の申請は公式システム（
                  <a href="https://www.jizokukanb.com/jizokuka_r6h/oubo.php" target="_blank"
                    className="underline text-blue-600">こちら</a>
                  ）から行ってください。
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 mt-4 border-t border-slate-200">
              {step > 1 && (
                <button onClick={() => { setStep(s => s - 1); setTimeout(() => { const el = document.getElementById('main-content'); if(el) el.scrollTop = 0; else window.scrollTo({top:0,behavior:'smooth'}); }, 30) }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all">
                  ← 前へ
                </button>
              )}
              <div className="ml-auto">
                {step < STEPS.length && (
                  <button onClick={() => { setStep(s => s + 1); setTimeout(() => { const el = document.getElementById('main-content'); if(el) el.scrollTop = 0; else window.scrollTo({top:0,behavior:'smooth'}); }, 30) }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#003087] hover:bg-blue-900 text-white rounded-xl font-medium text-sm shadow-md transition-all">
                    次へ →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0">
            <div className="p-3 border-b border-slate-200 bg-primary-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-semibold text-primary-800">AIサポート</span>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            {/* Quick tips for current step */}
            <div className="p-3 bg-blue-50 border-b border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">
                {['', 'GビズIDについて', '基本情報の入力方法', '経営計画書のポイント', '補助事業計画のコツ', '経費の入力注意事項', '書類添付の注意点', '最終確認のチェック'][step]}
              </p>
              <p className="text-xs text-blue-600">
                {['', 'GビズIDプライムでのログインが必要です。エントリーや暫定プライムでは申請できません。',
                  '黄色背景の項目はGビズIDから自動反映されます。業種と従業員数は要件確認に重要です。',
                  '「具体的な数字・実例」を入れることが採択率向上のポイントです。',
                  '「誰に・何を・どう・いつ」を明確に。数値目標を必ず入れてください。',
                  '見積書を用意してから入力を。単価50万円超は2社見積が必要です。',
                  '様式4と確定申告書は必須です。スキャンはカラーで鮮明に。',
                  '締切直前は混雑します。余裕を持って送信してください。'][step]}
              </p>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {aiMessages.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500">画面についての質問や<br/>入力内容の相談ができます</p>
                  <div className="mt-3 space-y-1.5">
                    {['この項目に何を書けばいい？', '添付書類の準備方法は？', 'エラーが出た時は？'].map(q => (
                      <button key={q} onClick={() => { setAiInput(q); }}
                        className="block w-full text-left text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 hover:bg-primary-100 transition-colors">
                        💬 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-1 p-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="typing-dot w-2 h-2 rounded-full bg-slate-300" />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && askAI()}
                  placeholder="質問を入力..."
                  className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <button onClick={askAI} disabled={!aiInput.trim() || aiLoading}
                  className="w-8 h-8 flex items-center justify-center bg-primary-500 hover:bg-primary-400 disabled:bg-slate-200 text-white rounded-xl transition-colors text-sm">
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Form field helper component
function FormField({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
