import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 })
    }

    // DB接続テスト
    let user
    try {
      user = await prisma.user.findUnique({ where: { username } })
    } catch (dbError) {
      console.error('DB connection error:', dbError)
      return NextResponse.json({ 
        error: 'データベース接続エラー。しばらく待ってから再試行してください。',
        detail: String(dbError)
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      role: user.role as 'admin' | 'customer',
      companyName: user.companyName || undefined,
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, companyName: user.companyName },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      detail: String(error)
    }, { status: 500 })
  }
}
