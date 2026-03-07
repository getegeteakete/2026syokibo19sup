import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// ============================================================
// 様式2（経営計画書）生成プロンプト
// ============================================================
function buildForm2Prompt(data: Record<string, string>, industry: string): string {
  return `
あなたは補助金申請の際に必要な事業計画書作成のプロです。
これから教える特定のスタイルに合わせて、事業計画書（様式2：経営計画書）を作成してください。

【前提条件】
- 文章は4つのパートで構成します
- "１．企業概要"は1000文字程度で、1-1.自社の概要、1-2.現在の売上・利益の状況、1-3.経営課題の3項目に分けて記載
  - 1-1：経営陣の経歴・経験も簡潔にまとめる
  - 1-2：売上高と売上総利益の表を作成し挿入。投資収益率などの指標も記載
  - 1-3：リスクと対処方法を課題として明確に記載
- "２．顧客ニーズと市場の動向"は1000文字程度で、2-1.市場の動向、2-2.顧客ニーズの2項目
  - 2-1：市場の成長率・規模・競争情報・出典元を記載。自社の優位性の見解も示す
  - 2-2：顧客が求める商品・サービス、競合他社の状況、売上を左右する環境を過去〜将来の見通しも含め記載
- "３．自社や自社の提供する商品・サービスの強み・弱み"は1000文字程度
- "４．経営方針・目標と今後のプラン"は1000文字程度
  - 4-2.今後のプランには販売チャネル・価格設定・販促活動を詳細に記載

【出力条件】
- 審査員は中小企業診断士や行政書士を想定し、彼らが納得する文章を作成
- 小規模事業者持続化補助金の様式2記載例・採択事例を参考に
- 情報が乏しい点は推測して記載
- わたしの指示は繰り返さず、題目ごとに分けて出力
- 1-2の売上状況には必ず表（Markdown形式）を挿入
- 市場動向には出典URLも記載

【業種】${industry || data.businessType || ''}

【ヒアリング情報】
${JSON.stringify(data, null, 2)}

以下の構成で出力してください：
１．企業概要
1-1.自社の概要
【概要】
【立地場所】
【主な商品・サービス】
【業務状況】
1-2.現在の売上・利益の状況
【売り上げの状況（表含む）】
1-3.経営課題
２．顧客ニーズと市場の動向
2-1.市場の動向
【当社事業に関わる市場の動向】
2-2.顧客ニーズ
【顧客のニーズ】
【競合他社の状況】
３．自社や自社の提供する商品・サービスの強み・弱み
４．経営方針・目標と今後のプラン
4-1.経営方針・目標
4-2.今後のプラン
`
}

// ============================================================
// 様式3（補助事業計画書）生成プロンプト
// ============================================================
function buildForm3Prompt(data: Record<string, string>, industry: string): string {
  return `
あなたは小規模事業者持続化補助金の補助事業計画書作成のスペシャリストです。
以下の情報を基に、具体的な補助事業計画書（様式3）を作成してください。

【前提条件】
- "１．補助事業で行う事業名"：30文字以内で5パターン提示（計画内容が瞬時に識別できるもの）
- "２．販路開拓等（生産性向上）の取組内容"：何をどのような方法で行うか具体的に記載。他社との差別化・創意工夫・特徴も記載
- "３．業務効率化（生産性向上）の取組内容"：計画内容から考えられる効率化を記載
- "４．補助事業の効果"：販路開拓・業務効率化が生産性向上につながる理由を説明。売上・取引への効果を具体的に記載

【出力条件】
- 審査員は中小企業診断士・行政書士を想定
- 小規模事業者持続化補助金の様式3記載例・採択事例を参考に
- 2-3.具体的な取組は経費区分ごとに分け、各経費の金額を表形式で記載
- 4-1.取組の効果には生産性向上との関連を必ず記載
- 4-2.効果の試算は現状年間売上を基に年間経費を推測し、営業利益ベースで投資額を1年以内に回収できる3年間の収支予測を表形式で作成。算出根拠も記載
- わたしの指示は繰り返さず、項目ごとに分けて出力

【業種】${industry || data.businessType || ''}

【ヒアリング情報】
${JSON.stringify(data, null, 2)}

以下の構成で出力してください：
１．補助事業で行う事業名（5案）
２．販路開拓等（生産性向上）の取組内容
2-1.事業の概要
2-2.背景・目的
2-3.具体的な取組
　∟取組内容（概要）
　∟具体的な取組内容（詳細・経費表含む）
３．業務効率化（生産性向上）の取組内容
3-1.背景・目的
3-2.具体的な取組
　∟取組内容（概要）
　∟具体的な取組内容（詳細）
４．補助事業の効果
4-1.取組の効果（生産性向上との関連を明記）
4-2.効果の試算（3年間収支予測表＋算出根拠）
`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const { type, industry } = await request.json() // type: 'form2' | 'form3'

    // ヒアリングデータを取得
    const hearingData = await prisma.hearingData.findUnique({ where: { userId: session.id } })
    if (!hearingData) return NextResponse.json({ error: 'ヒアリングデータがありません。先にヒアリングを完了してください。' }, { status: 400 })

    const data = { ...hearingData } as Record<string, string>
    delete data.id
    delete data.userId
    delete data.createdAt
    delete data.updatedAt

    const prompt = type === 'form2'
      ? buildForm2Prompt(data, industry || '')
      : buildForm3Prompt(data, industry || '')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // applicationDraftとして保存
    const existingDraft = JSON.parse(hearingData.applicationDraft || '{}')
    const updatedDraft = { ...existingDraft, [type]: text, [`${type}_generatedAt`]: new Date().toISOString() }
    await prisma.hearingData.update({
      where: { userId: session.id },
      data: { applicationDraft: JSON.stringify(updatedDraft) }
    })

    return NextResponse.json({
      success: true,
      document: text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    })
  } catch (e) {
    console.error('POST /api/documents/generate error:', e)
    return NextResponse.json({ error: `生成エラー: ${String(e)}` }, { status: 500 })
  }
}
