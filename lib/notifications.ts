import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface NotificationPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email Mock]', payload.subject, '→', payload.to)
    return { success: true }
  }
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    console.log('[SMS Mock]', body, '→', to)
    return { success: true }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const params = new URLSearchParams({ To: to, From: from, Body: body })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    if (!res.ok) throw new Error(await res.text())
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Email templates
export function buildDeadlineEmail(params: {
  companyName: string
  daysLeft: number
  deadlineLabel: string
  deadline: string
  action: string
  actionUrl?: string
}): string {
  const urgentColor = params.daysLeft <= 3 ? '#dc2626' : params.daysLeft <= 7 ? '#d97706' : '#4a57e8'
  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Noto Sans JP',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:${urgentColor};padding:24px;text-align:center;">
        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 8px;">小規模事業者持続化補助金 第19回</p>
        <h1 style="color:white;font-size:22px;margin:0;font-weight:700;">
          ⏰ ${params.deadlineLabel}まで<br/>
          <span style="font-size:36px;">${params.daysLeft}日</span>
        </h1>
      </div>
      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:#334155;font-size:15px;">${params.companyName} 様</p>
        <p style="color:#475569;font-size:14px;line-height:1.7;">
          <strong>${params.deadlineLabel}</strong>（${params.deadline}）まで残り <strong style="color:${urgentColor};">${params.daysLeft}日</strong> となりました。
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 8px;">📌 今すぐやること</p>
          <p style="color:#475569;font-size:14px;margin:0;">${params.action}</p>
        </div>
        ${params.actionUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${params.actionUrl}" style="background:${urgentColor};color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">
            システムを開く →
          </a>
        </div>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;">このメールは補助金サポートシステムから自動送信されています。</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function buildSMSMessage(params: { companyName: string; daysLeft: number; deadlineLabel: string; action: string }): string {
  return `【補助金サポート】${params.companyName}様 ${params.deadlineLabel}まで残り${params.daysLeft}日です。${params.action}`
}
