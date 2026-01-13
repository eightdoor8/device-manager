import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Navbar.css'

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">📱</span>
          Device Manager
        </Link>

        <ul className="navbar-menu">
          <li>
            <Link
              to="/dashboard"
              className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link
              to="/devices"
              className={`navbar-link ${isActive('/devices') ? 'active' : ''}`}
            >
              端末管理
            </Link>
          </li>
          <li>
            <Link
              to="/users"
              className={`navbar-link ${isActive('/users') ? 'active' : ''}`}
            >
              ユーザー管理
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={`navbar-link ${isActive('/settings') ? 'active' : ''}`}
            >
              設定
            </Link>
          </li>
        </ul>

        <div className="navbar-user">
          <span className="user-name">{user?.name || user?.email || 'ユーザー'}</span>
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
