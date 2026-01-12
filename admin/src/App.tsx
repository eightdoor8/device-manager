import { useState, useEffect } from 'react'
import './App.css'
import { trpc } from './lib/trpc'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const loginMutation = trpc.auth.login.useMutation()
  const registerMutation = trpc.auth.register.useMutation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginMutation.mutateAsync({ email, password })
      if (result.user) {
        setUser(result.user)
        setIsLoggedIn(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await registerMutation.mutateAsync({ email, password, name })
      if (result.user) {
        setUser(result.user)
        setIsLoggedIn(true)
        setShowRegister(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const logoutMutation = trpc.auth.logout.useMutation()

  // Check if user is already logged in on mount
  const { data: currentUser } = trpc.auth.me.useQuery()
  
  useEffect(() => {
    if (!isInitialized && currentUser) {
      setUser(currentUser)
      setIsLoggedIn(true)
      setIsInitialized(true)
    } else if (!isInitialized && !currentUser) {
      setIsInitialized(true)
    }
  }, [currentUser, isInitialized])

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      setIsLoggedIn(false)
      setUser(null)
      setEmail('')
      setPassword('')
      setName('')
      setIsInitialized(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました')
    }
  }

  const handleToggleRegister = () => {
    setShowRegister(!showRegister)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
  }

  if (isLoggedIn && user) {
    return (
      <div className="container">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>Device Manager</h1>
            <button onClick={handleLogout} className="logout-button">ログアウト</button>
          </div>

          <div className="welcome-section">
            <h2>ようこそ、{user.name || user.email}さん</h2>
            <p>ロール: <strong>{user.role}</strong></p>
          </div>

          <div className="dashboard-content">
            <h3>ダッシュボード</h3>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">📱</div>
                <h4>デバイス管理</h4>
                <p>登録されているデバイスを管理します</p>
                <button className="card-button">デバイス一覧を表示</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">👥</div>
                <h4>ユーザー管理</h4>
                <p>システムユーザーを管理します</p>
                <button className="card-button">ユーザー一覧を表示</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">⚙️</div>
                <h4>設定</h4>
                <p>システム設定を変更します</p>
                <button className="card-button">設定を開く</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showRegister) {
    return (
      <div className="container">
        <div className="card">
          <h1>Device Manager</h1>
          <p className="subtitle">新規登録</p>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">ユーザー名（任意）</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ユーザー名を入力"
                disabled={loading || registerMutation.isPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                required
                disabled={loading || registerMutation.isPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード（6文字以上）</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                minLength={6}
                disabled={loading || registerMutation.isPending}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading || registerMutation.isPending}>
              {loading || registerMutation.isPending ? '登録中...' : '登録'}
            </button>
          </form>

          <p style={{ marginTop: '16px', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={handleToggleRegister}
              style={{ background: 'none', border: 'none', color: '#0a7ea4', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ログインに戻る
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Device Manager</h1>
        <p className="subtitle">管理画面へログイン</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
              required
              disabled={loading || loginMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              disabled={loading || loginMutation.isPending}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || loginMutation.isPending}>
            {loading || loginMutation.isPending ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={handleToggleRegister}
            style={{ background: 'none', border: 'none', color: '#0a7ea4', cursor: 'pointer', textDecoration: 'underline' }}
          >
            新規登録
          </button>
        </p>
      </div>
    </div>
  )
}

export default App
