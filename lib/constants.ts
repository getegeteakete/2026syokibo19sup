// 第19回公募スケジュール
export const SCHEDULE = {
  publicationDate: new Date('2026-01-28'),
  applicationStart: new Date('2026-03-06'),
  applicationDeadline: new Date('2026-04-30T17:00:00'),
  shokoukaideadline: new Date('2026-04-16'),
  adoptionAnnouncement: new Date('2026-07-01'), // 予定
  projectEndDate: new Date('2027-06-30'),
  reportDeadline: new Date('2027-07-10'),
}

// 補助金概要
export const SUBSIDY_INFO = {
  name: '小規模事業者持続化補助金＜一般型＞',
  round: '第19回',
  maxSubsidy: 500000, // 上限50万円
  subsidyRate: 2/3, // 補助率2/3
  specialMaxSubsidy: 2000000, // 特例枠200万円
}

// ワークフローステージ
export const STAGES = [
  { id: 'requirement_check', label: '申請要件チェック', icon: '✅' },
  { id: 'amount_check', label: '補助額シミュレーション', icon: '💰' },
  { id: 'hearing', label: 'ヒアリング・事業計画', icon: '📝' },
  { id: 'shokoukai', label: '商工会議所 面談・様式4', icon: '🏢' },
  { id: 'document_prep', label: '申請書類作成', icon: '📄' },
  { id: 'electronic_app', label: '電子申請', icon: '💻' },
  { id: 'waiting', label: '審査待ち', icon: '⏳' },
  { id: 'adopted', label: '採択・交付決定', icon: '🎉' },
  { id: 'report_prep', label: '実績報告', icon: '📊' },
  { id: 'completed', label: '完了', icon: '🏆' },
]

// ヒアリング項目定義
export const HEARING_SECTIONS = [
  {
    id: 'company',
    title: '会社基本情報',
    icon: '🏢',
    questions: [
      { id: 'companyName', label: '会社名・屋号', type: 'text', required: true },
      { id: 'representativeName', label: '代表者名', type: 'text', required: true },
      { id: 'address', label: '所在地（都道府県・市区町村）', type: 'text', required: true },
      { id: 'phone', label: '電話番号', type: 'text', required: true },
      { id: 'email', label: 'メールアドレス', type: 'text', required: true },
      { id: 'businessType', label: '業種', type: 'select', options: ['小売業', '宿泊業・娯楽業', 'サービス業（宿泊業、娯楽業除く）', '製造業、その他'], required: true },
      { id: 'employeeCount', label: '常時使用する従業員数', type: 'select', options: ['0人（代表者のみ）', '1〜2人', '3〜5人', '6〜10人', '11〜20人'], required: true },
      { id: 'foundingYear', label: '創業年', type: 'text', required: false },
      { id: 'annualSales', label: '直近の年間売上高（概算）', type: 'text', required: false },
    ]
  },
  {
    id: 'current_business',
    title: '現在の事業内容',
    icon: '📊',
    questions: [
      { id: 'currentBusiness', label: '現在の主な事業内容', type: 'textarea', required: true },
      { id: 'mainProducts', label: '主な商品・サービス', type: 'textarea', required: true },
      { id: 'targetCustomers', label: '主な顧客層・ターゲット', type: 'textarea', required: true },
      { id: 'salesChannels', label: '現在の販売チャネル・販路', type: 'textarea', required: true },
      { id: 'strengths', label: '自社の強み・特徴', type: 'textarea', required: true },
      { id: 'challenges', label: '現在の課題・悩み', type: 'textarea', required: true },
    ]
  },
  {
    id: 'subsidy_plan',
    title: '補助事業計画',
    icon: '🎯',
    questions: [
      { id: 'subsidyPurpose', label: '補助金で何を実現したいですか？', type: 'textarea', required: true },
      { id: 'plannedActivities', label: '具体的に取り組む内容（販路開拓の方法）', type: 'textarea', required: true },
      { id: 'expectedEffects', label: '取組の効果・見込まれる成果', type: 'textarea', required: true },
      { id: 'requestedAmount', label: '補助金申請希望額（円）', type: 'text', required: true },
      { id: 'ownContribution', label: '自己負担額（円）', type: 'text', required: false },
      { id: 'implementationPlan', label: '実施スケジュール（いつまでに何をするか）', type: 'textarea', required: true },
    ]
  }
]

// 申請要件チェックリスト
export const REQUIREMENT_CHECKS = [
  { id: 'small_biz', label: '小規模事業者に該当する（従業員数の確認）', description: '商業・宿泊業・娯楽業・サービス業：5人以下、製造業他：20人以下' },
  { id: 'japan_base', label: '日本国内に本社・主たる事業所がある', description: '' },
  { id: 'not_applied', label: '同じ補助金に採択されてから5年以内に再申請していない（一定条件あり）', description: '' },
  { id: 'has_plan', label: '経営計画書を作成できる', description: '持続的な経営に向けた計画が必要です' },
  { id: 'shokoukai', label: '商工会議所・商工会の会員、または加入見込みである', description: '様式4（事業支援計画書）の発行を受けるために必要' },
  { id: 'invoice', label: 'インボイス対応等の確認', description: '免税事業者の場合は補助率が下がる場合があります' },
  { id: 'gbiz_id', label: 'GビズIDプライムのアカウントを取得（または取得予定）', description: '電子申請に必要。取得に2〜3週間かかります' },
]

// 必要書類チェックリスト
export const REQUIRED_DOCUMENTS = [
  { id: 'keiei_keikaku', label: '経営計画書（様式2）', required: true, description: '自社の概要・現状・経営方針を記載' },
  { id: 'hojo_jigyou', label: '補助事業計画書（様式3-1、3-2）', required: true, description: '補助事業の内容・経費を記載' },
  { id: 'shien_keikaku', label: '事業支援計画書（様式4）', required: true, description: '商工会議所が発行。4/16締切' },
  { id: 'kakutei_shinkoku', label: '直近の確定申告書の写し', required: true, description: '個人：白色・青色申告書、法人：法人税申告書' },
  { id: 'tsumitate', label: '貸借対照表・損益計算書（直近1期分）', required: false, description: '法人の場合' },
  { id: 'meibo', label: '従業員名簿（常時使用する従業員がいる場合）', required: false, description: '' },
  { id: 'gbizid', label: 'GビズIDプライムの取得確認', required: true, description: '電子申請に必要' },
]

export const CHAT_SYSTEM_PROMPTS: Record<string, string> = {
  general: `あなたは小規模事業者持続化補助金（第19回・一般型）の申請を支援する専門AIアシスタントです。
2026年申請版として最新情報を把握しています。

【補助金概要】
- 補助上限額：50万円（特定枠は200万円）
- 補助率：2/3
- 申請締切：2026年4月30日17:00
- 様式4発行締切：2026年4月16日

顧客の質問に対して、具体的・実践的・わかりやすく回答してください。
専門用語は噛み砕いて説明し、次のアクションが明確になるよう回答してください。
返答は必ず日本語で行ってください。`,

  hearing: `あなたは小規模事業者持続化補助金の申請書類作成を支援する専門家AIです。
ヒアリング形式で、一問一答で顧客から情報を引き出してください。

質問は1〜2つずつ行い、回答に応じて深掘りしてください。
回答内容は申請書類（経営計画書・補助事業計画書）の作成に活用されます。
具体的な数字、エピソード、将来ビジョンを引き出すことを意識してください。
返答は必ず日本語で行ってください。`,

  document: `あなたは小規模事業者持続化補助金の申請書類を作成する専門家AIです。
収集したヒアリングデータをもとに、採択されやすい申請書類の下書きを作成します。

以下の点を意識してください：
1. 審査官に響く具体的な表現
2. 数値目標の明示
3. 地域・社会への貢献の強調
4. 実現可能性のある計画
返答は必ず日本語で行ってください。`,

  guide: `あなたはGビズIDや電子申請システムの操作をサポートする専門AIです。
ユーザーが画面のスクリーンショットを見せたり、操作に迷っている場合は、
わかりやすいステップバイステップで案内してください。
画像が添付された場合は、その画面の内容を説明し、次に何をすべきか教えてください。
返答は必ず日本語で行ってください。`,
}
