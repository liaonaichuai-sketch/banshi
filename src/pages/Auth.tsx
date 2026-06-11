import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (isRegister) {
      const { error: signUpError } = await signUp(email, password, nickname || email.split('@')[0])
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setError('注册成功！请查看邮箱确认链接（或直接在 Supabase 关闭邮箱验证后登录）')
      }
    } else {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError('登录失败，请检查邮箱和密码')
      } else {
        navigate('/')
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold mb-2">搬石上山</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {isRegister ? '创建你的账户' : '欢迎回来'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="怎么称呼你？"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm p-3 rounded-lg" style={{ background: error.includes('成功') ? '#e6ffed' : '#fff0f0', color: error.includes('成功') ? '#1a7f37' : '#cf222e' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {isRegister ? '已有账户？' : '没有账户？'}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="ml-1 font-medium underline"
            style={{ color: 'var(--color-text)' }}
          >
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>
      </div>
    </div>
  )
}
