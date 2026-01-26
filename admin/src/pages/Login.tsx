import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type AuthError,
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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized');
      }

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      // ID トークンをローカルストレージに保存
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('userEmail', userCredential.user.email || '');

      console.log('[Google Login] Successfully logged in:', userCredential.user.email);

      // ダッシュボードへ遷移
      navigate('/');
    } catch (err: any) {
      console.error('[Google Login] Error:', err);
      const authError = err as AuthError;
      
      // Firebase のエラーメッセージを日本語に変換
      let errorMessage = 'Google ログインに失敗しました';
      if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'ログインがキャンセルされました';
      } else if (authError.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされています';
      } else if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google ログインが有効になっていません';
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setRegisterError('');
    setRegisterLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized');
      }

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      // ID トークンをローカルストレージに保存
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('userEmail', userCredential.user.email || '');

      console.log('[Google Register] Successfully registered:', userCredential.user.email);

      // ダッシュボードへ遷移
      navigate('/');
    } catch (err: any) {
      console.error('[Google Register] Error:', err);
      const authError = err as AuthError;
      
      let errorMessage = 'Google 登録に失敗しました';
      if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = '登録がキャンセルされました';
      } else if (authError.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされています';
      } else if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google 登録が有効になっていません';
      }
      
      setRegisterError(errorMessage);
    } finally {
      setRegisterLoading(false);
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

            <div className="divider">または</div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="google-button"
              disabled={googleLoading || loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'ログイン中...' : 'Google でログイン'}
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

            <div className="divider">または</div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              className="google-button"
              disabled={googleLoading || registerLoading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? '登録中...' : 'Google で登録'}
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
// Force rebuild
