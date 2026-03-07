'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        if (data.user.role === 'admin') router.push('/admin')
        else router.push('/dashboard')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');
        .login-root {
          min-height: 100vh;
          background-color: #faf7f4;
          background-image:
            radial-gradient(ellipse 80% 60% at 15% 10%, rgba(251,176,99,0.13) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 88%, rgba(210,195,180,0.18) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23c4a882' fill-opacity='0.045'%3E%3Cpath d='M10 10h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zm-28 14h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zm-28 14h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Noto Sans JP', sans-serif;
        }
        .login-wrap {
          width: 100%;
          max-width: 400px;
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .l-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(224,125,42,0.1);
          border: 1px solid rgba(219,139,50,0.22);
          border-radius: 999px;
          padding: 5px 14px;
          margin-bottom: 16px;
        }
        .l-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #d97020;
          animation: blink 2.2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.35; }
        }
        .l-badge-txt {
          font-size: 11.5px;
          font-weight: 500;
          color: #b85e18;
          letter-spacing: 0.01em;
        }
        .l-title {
          font-size: 28px;
          font-weight: 700;
          color: #231e1a;
          letter-spacing: -0.025em;
          line-height: 1.18;
        }
        .l-sub {
          font-size: 12.5px;
          color: #9a8778;
          margin-top: 7px;
          font-weight: 400;
          line-height: 1.5;
        }
        .l-card {
          background: #fff;
          border: 1px solid rgba(196,168,130,0.22);
          border-radius: 20px;
          padding: 34px 30px 28px;
          margin-top: 28px;
          box-shadow:
            0 2px 4px rgba(80,50,20,0.05),
            0 12px 40px rgba(160,110,60,0.09);
        }
        .l-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #3a302a;
          margin-bottom: 22px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f2e9e1;
          letter-spacing: 0.01em;
        }
        .l-field { margin-bottom: 16px; }
        .l-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #8a7868;
          margin-bottom: 6px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .l-input {
          width: 100%;
          background: #faf7f4;
          border: 1.5px solid #ecddd2;
          border-radius: 11px;
          padding: 11px 15px;
          font-size: 14px;
          font-family: 'Noto Sans JP', sans-serif;
          color: #231e1a;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .l-input::placeholder { color: #c8b4a4; }
        .l-input:focus {
          border-color: #d97020;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(217,112,32,0.1);
        }
        .l-err {
          background: #fff4f1;
          border: 1px solid rgba(210,60,30,0.18);
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12.5px;
          color: #b83820;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .l-btn {
          width: 100%;
          background: #231e1a;
          color: #fff8f3;
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          border: none;
          border-radius: 11px;
          padding: 13px;
          cursor: pointer;
          letter-spacing: 0.06em;
          transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
          margin-top: 6px;
        }
        .l-btn:hover:not(:disabled) {
          background: #38302a;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(35,30,26,0.22);
        }
        .l-btn:active:not(:disabled) { transform: translateY(0); }
        .l-btn:disabled { background: #c0ada0; cursor: not-allowed; }
        .l-btn-inner { display:flex; align-items:center; justify-content:center; gap:8px; }
        .l-spin {
          width:15px; height:15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .l-note {
          font-size: 11px;
          color: #b8a898;
          text-align: center;
          margin-top: 18px;
        }
        .l-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 9px;
          margin-top: 18px;
        }
        .l-foot-item {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(196,168,130,0.18);
          border-radius: 13px;
          padding: 11px 6px;
          text-align: center;
        }
        .l-foot-svg { width:22px; height:22px; color:#b07040; margin:0 auto 6px; display:block; }
        .l-foot-lbl { font-size: 10.5px; color: #9a8778; font-weight: 500; }
      `}</style>

      <div className="login-root">
        <div className="login-wrap">

          <div className="l-badge">
            <span className="l-dot" />
            <span className="l-badge-txt">申請受付中　〜　2026年4月30日</span>
          </div>

          <h1 className="l-title">補助金サポート<br/>システム</h1>
          <p className="l-sub">小規模事業者持続化補助金＜一般型＞ 第19回</p>

          <div className="l-card">
            <p className="l-card-title">アカウントにログイン</p>

            <form onSubmit={handleLogin}>
              <div className="l-field">
                <label className="l-label">ユーザーID</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="IDを入力"
                  required
                  className="l-input"
                />
              </div>
              <div className="l-field">
                <label className="l-label">パスワード</label>
                <div style={{position:'relative'}}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    required
                    className="l-input"
                    style={{paddingRight:'44px'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:'2px',color:'#9a8778',display:'flex',alignItems:'center'}}
                    tabIndex={-1}
                    aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="l-err">
                  <span>⚠</span><span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="l-btn">
                <span className="l-btn-inner">
                  {loading ? <><span className="l-spin" />ログイン中...</> : 'ログイン'}
                </span>
              </button>
            </form>

            <p className="l-note">アカウントをお持ちでない方は担当者にご連絡ください</p>
          </div>

          <div className="l-footer">
            <div className="l-foot-item">
              <svg className="l-foot-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                <circle cx="12" cy="16" r="1.2"/>
              </svg>
              <div className="l-foot-lbl">セキュア認証</div>
            </div>
            <div className="l-foot-item">
              <svg className="l-foot-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.5 2 2 6 2 11c0 2.4 1 4.6 2.6 6.2L4 21l3.9-1.3C9.2 20.5 10.6 21 12 21c5.5 0 10-4 10-9s-4.5-10-10-10z"/>
                <path d="M8 11h.01M12 11h.01M16 11h.01"/>
              </svg>
              <div className="l-foot-lbl">AI申請支援</div>
            </div>
            <div className="l-foot-item">
              <svg className="l-foot-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2"/>
                <path d="M11 18h2"/>
              </svg>
              <div className="l-foot-lbl">スマホ対応</div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
