import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase-auth';
import '../styles/Login.css';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Firebase Authentication でログイン
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // ID トークンをローカルストレージに保存
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('userEmail', userCredential.user.email || '');

      console.log('[Login] Successfully logged in:', userCredential.user.email);

      // ダッシュボードへ遷移
      navigate('/');
    } catch (err: any) {
      console.error('[Login] Error:', err);
      const authError = err as AuthError;
      
      // Firebase のエラーメッセージを日本語に変換
      let errorMessage = 'ログインに失敗しました';
      if (authError.code === 'auth/user-not-found') {
        errorMessage = 'ユーザーが見つかりません';
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが間違っています';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスが無効です';
      } else if (authError.code === 'auth/user-disabled') {
        errorMessage = 'このユーザーは無効化されています';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      // Firebase Authentication でユーザー登録
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );

      // ユーザープロフィールを更新（名前を設定）
      await userCredential.user.getIdToken();

      console.log('[Register] Successfully registered:', userCredential.user.email);

      // ログイン画面に戻す
      setShowRegister(false);
      setEmail(registerEmail);
      setPassword(registerPassword);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
    } catch (err: any) {
      console.error('[Register] Error:', err);
      const authError = err as AuthError;

      // Firebase のエラーメッセージを日本語に変換
      let errorMessage = '登録に失敗しました';
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます（6文字以上）';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスが無効です';
      }

      setRegisterError(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Device Manager</h1>
        <p className="login-subtitle">管理画面へログイン</p>

        {!showRegister ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <p className="register-link">
              アカウントをお持ちでないですか？{' '}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="link-button"
              >
                登録する
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="register-name">名前</label>
              <input
                id="register-name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="山田太郎"
                disabled={registerLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">メールアドレス</label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={registerLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">パスワード</label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="パスワード（6文字以上）"
                required
                disabled={registerLoading}
              />
            </div>

            {registerError && <div className="error-message">{registerError}</div>}

            <button type="submit" className="login-button" disabled={registerLoading}>
              {registerLoading ? '登録中...' : '登録'}
            </button>

            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="cancel-button"
              disabled={registerLoading}
            >
              ログイン画面に戻る
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
