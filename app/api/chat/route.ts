import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { CHAT_SYSTEM_PROMPTS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const anthropic = new Anthropic()
    const formData = await request.formData()
    const message = formData.get('message') as string
    const section = (formData.get('section') as string) || 'general'
    const historyStr = formData.get('history') as string
    const imageFile = formData.get('image') as File | null

    if (!message) {
      return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 })
    }

    // Check token limit
    const settings = await prisma.systemSettings.findFirst()
    const userTokens = await prisma.tokenUsage.aggregate({
      where: { userId: session.id },
      _sum: { inputTokens: true, outputTokens: true },
    })
    const totalUsed = (userTokens._sum.inputTokens || 0) + (userTokens._sum.outputTokens || 0)
    const limit = settings?.perUserTokenLimit || 50000

    if (totalUsed >= limit) {
      return NextResponse.json({
        error: `トークン使用制限(${limit.toLocaleString()})に達しました。管理者にご連絡ください。`
      }, { status: 429 })
    }

    // Build message history
    const history = historyStr ? JSON.parse(historyStr) : []

    // Build current user message
    let userContent: Anthropic.MessageParam['content']

    if (imageFile) {
      const imageBuffer = await imageFile.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString('base64')
      const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      userContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        { type: 'text', text: message },
      ]
    } else {
      userContent = message
    }

    const systemPrompt = CHAT_SYSTEM_PROMPTS[section] || CHAT_SYSTEM_PROMPTS.general

    // Add hearing data context if available (general も含めて全セクション)
    let contextAddition = ''
    const hearing = await prisma.hearingData.findUnique({ where: { userId: session.id } })
    if (hearing) {
      const filledFields = Object.entries(hearing)
        .filter(([k, v]) => !['id','userId','createdAt','updatedAt','completionRate','applicationDraft'].includes(k) && v && String(v).trim())
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
      if (filledFields) {
        contextAddition = `\n\n【この顧客の収集済みプロフィール情報】\n${filledFields}\n（上記は既に把握済みの情報です。ヒアリングに誘導する際はこれらは再度聞く必要がありません）`
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt + contextAddition,
      messages: [
        ...history,
        { role: 'user', content: userContent },
      ],
    })

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens

    // Save messages to DB
    await prisma.chatMessage.create({
      data: {
        userId: session.id,
        role: 'user',
        content: message,
        section,
        tokens: inputTokens,
      }
    })

    await prisma.chatMessage.create({
      data: {
        userId: session.id,
        role: 'assistant',
        content: assistantContent,
        section,
        tokens: outputTokens,
      }
    })

    // Track token usage
    await prisma.tokenUsage.create({
      data: {
        userId: session.id,
        inputTokens,
        outputTokens,
      }
    })

    // [REDIRECT_TO_HEARING] シグナル検知
    const hasRedirect = assistantContent.includes('[REDIRECT_TO_HEARING]')
    const cleanMessage = assistantContent.replace(/\[REDIRECT_TO_HEARING\]/g, '').trim()

    return NextResponse.json({
      message: cleanMessage,
      redirectToHearing: hasRedirect,
      usage: { inputTokens, outputTokens, totalUsed: totalUsed + inputTokens + outputTokens, limit },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'AIとの通信でエラーが発生しました' }, { status: 500 })
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'general'
    const userId = session.role === 'admin' ? (searchParams.get('userId') || session.id) : session.id

    const messages = await prisma.chatMessage.findMany({
      where: { userId, section },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    return NextResponse.json({ messages })
  } catch(e) {
    console.error('GET /api/chat error:', e)
    return NextResponse.json({ messages: [] })
  }
}
