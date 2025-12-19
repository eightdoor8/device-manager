# Android 15 トラブルシューティングガイド

このドキュメントでは、Device ManagerアプリをAndroid 15デバイスで実行する際に発生する可能性のある問題と、その解決方法について説明します。

## 問題1: アプリ起動直後のクラッシュ

### 症状

アプリをインストールして起動すると、すぐにクラッシュしてエラーメッセージが表示されない。

### 原因

以下の原因が考えられます。

1. **Firebase設定の不足**: `.env` ファイルが設定されていない、または設定情報が不完全
2. **環境変数の読み込み失敗**: Expo Goアプリが環境変数を正しく読み込めていない
3. **Android 15のセキュリティ制限**: 新しいセキュリティポリシーによる制限

### 解決方法

#### ステップ1: Firebase設定の確認

`.env` ファイルがプロジェクトのルートディレクトリに存在し、すべての必須環境変数が設定されているか確認してください。

```bash
# .env ファイルの例
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

#### ステップ2: Expo Goアプリの再起動

Expo Goアプリを完全に終了し、再度起動してください。環境変数の変更は、アプリの再起動後に反映されます。

```bash
# 開発サーバーを再起動
pnpm dev
```

#### ステップ3: ログの確認

Expo Goアプリ内でエラーメッセージが表示されているか確認してください。以下の手順でログを確認できます。

1. Expo Goアプリを起動
2. 画面下部の「Logs」タブをタップ
3. エラーメッセージを確認

#### ステップ4: 開発サーバーのコンソールログを確認

ブラウザの開発者ツール（F12）を開き、コンソールタブでエラーメッセージを確認してください。以下のようなエラーが表示される場合があります。

- `[Firebase] Configuration incomplete. Please set environment variables...`
- `[Firebase] Initialization error: ...`

### 詳細なエラーメッセージの確認

アプリがクラッシュする際に詳細なエラー情報を取得するには、以下の方法を試してください。

#### Android Studio Logcatの使用

1. Android Studioを起動
2. `Logcat` ウィンドウを開く（View > Tool Windows > Logcat）
3. デバイスを選択
4. アプリを起動
5. ログを確認

#### adbコマンドの使用

```bash
# デバイスのログをリアルタイムで表示
adb logcat | grep -i "device-manager\|firebase\|error"

# 特定のパッケージのログのみ表示
adb logcat | grep "space.manus.device.manager"
```

## 問題2: Firebase接続エラー

### 症状

ログイン画面は表示されるが、ログインボタンをタップするとエラーが発生する。

### 原因

Firebaseプロジェクトの設定が不正、またはセキュリティルールが厳しすぎる可能性があります。

### 解決方法

#### ステップ1: Firebaseコンソールで設定を確認

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 「Project Settings」を開く
4. 「Your apps」セクションで、Webアプリが登録されているか確認
5. 登録されていない場合は、新しいWebアプリを追加

#### ステップ2: Firestoreセキュリティルールを確認

1. Firestore Database を選択
2. 「Rules」タブを開く
3. 以下のルールが設定されているか確認

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /devices/{deviceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

#### ステップ3: Authentication設定を確認

1. Authentication を選択
2. 「Sign-in method」タブを開く
3. 「Email/Password」が有効化されているか確認

## 問題3: 権限エラー

### 症状

「Permission denied」というエラーが表示される。

### 原因

Firestoreのセキュリティルールが厳しすぎるか、ユーザーの権限が不足している可能性があります。

### 解決方法

#### テスト用のセキュリティルールを使用（開発環境のみ）

開発環境では、以下の緩いセキュリティルールを使用してテストできます。本番環境では、必ずセキュリティルールを厳格に設定してください。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 開発環境用: すべてのコレクションに対して認証済みユーザーのアクセスを許可
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 問題4: ネットワーク接続エラー

### 症状

「Network error」というエラーが表示される。

### 原因

デバイスがインターネットに接続されていない、またはファイアウォールがブロックしている可能性があります。

### 解決方法

1. デバイスがWi-Fiまたはモバイルネットワークに接続されているか確認
2. 他のアプリがインターネットに接続できるか確認
3. ファイアウォール設定を確認
4. デバイスを再起動

## 問題5: パフォーマンスの低下

### 症状

アプリが遅い、またはフリーズすることがある。

### 原因

Firestoreからのデータ取得が遅い、またはメモリ不足の可能性があります。

### 解決方法

1. **Firestoreのインデックスを確認**: Firestore Consoleで、検索に使用しているフィールドのインデックスが作成されているか確認
2. **メモリ使用量を確認**: Android Studio Profilerを使用してメモリ使用量を確認
3. **不要なリアルタイムリスナーを削除**: 使用していないリアルタイムリスナーがないか確認

## デバッグモードの有効化

より詳細なログを取得するには、以下の環境変数を設定してください。

```bash
# .env ファイルに追加
DEBUG=*
```

その後、アプリを再起動してください。

## サポート

上記の方法で問題が解決しない場合は、以下の情報を収集して、開発チームに報告してください。

1. **エラーメッセージ**: 完全なエラーメッセージ
2. **スタックトレース**: コンソールに表示されるスタックトレース
3. **デバイス情報**: Androidバージョン、デバイスモデル
4. **再現手順**: 問題を再現するための具体的な手順
5. **ログファイル**: Logcatまたはadbコマンドで取得したログ

## 参考リンク

- [Firebase Troubleshooting](https://firebase.google.com/docs/troubleshooting)
- [Expo Debugging](https://docs.expo.dev/debugging/runtime-issues/)
- [Android 15 Compatibility](https://developer.android.com/about/versions/15)
