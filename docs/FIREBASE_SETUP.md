# Firebase設定手順書

このドキュメントでは、Device ManagerアプリでFirebaseを使用するための設定手順を説明します。

## 前提条件

Firebaseプロジェクトを作成し、Firebase Authentication と Firestore Database を有効化する必要があります。

## 手順1: Firebaseプロジェクトの作成

Firebaseコンソール（https://console.firebase.google.com/）にアクセスし、新しいプロジェクトを作成します。プロジェクト名は任意ですが、例として「device-manager」などが適切です。

## 手順2: Webアプリの登録

Firebaseプロジェクトのコンソールで、Webアプリを登録します。プロジェクトの設定画面から「アプリを追加」を選択し、Webプラットフォームを選択してください。アプリのニックネームを入力し、Firebase Hostingの設定は不要です。

登録が完了すると、Firebase設定オブジェクトが表示されます。この情報は後で使用するため、メモしておいてください。

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 手順3: Firebase Authenticationの有効化

Firebaseコンソールの左側メニューから「Authentication」を選択し、「始める」ボタンをクリックします。次に、「Sign-in method」タブを選択し、「メール/パスワード」を有効化してください。

## 手順4: Firestoreの有効化

Firebaseコンソールの左側メニューから「Firestore Database」を選択し、「データベースの作成」ボタンをクリックします。セキュリティルールは「本番環境モード」を選択し、ロケーションは任意の場所（例: asia-northeast1）を選択してください。

## 手順5: Firestoreセキュリティルールの設定

Firestoreのセキュリティルールを以下のように設定します。これにより、認証済みユーザーのみがデータにアクセスできるようになります。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Devices collection
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

## 手順6: 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、手順2で取得したFirebase設定情報を以下の形式で記述します。

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

`.env` ファイルは `.gitignore` に追加されているため、Gitリポジトリにコミットされることはありません。

## 手順7: 初期ユーザーの作成

アプリを起動し、ログイン画面で「新規登録」を選択して、最初のユーザーアカウントを作成します。作成したユーザーは自動的に「一般ユーザー」権限で登録されます。

管理者権限を付与する場合は、Firebaseコンソールの Firestore Database から該当ユーザーのドキュメントを開き、`role` フィールドを `admin` に変更してください。

## 手順8: 動作確認

アプリを起動し、以下の機能が正常に動作することを確認します。

- ログイン・ログアウト
- 端末一覧の表示
- 端末の登録
- 端末の貸出・返却

## トラブルシューティング

### 認証エラーが発生する

Firebase Authentication の設定が正しく行われているか確認してください。特に、メール/パスワード認証が有効化されているかを確認してください。

### Firestoreへの書き込みエラーが発生する

Firestoreのセキュリティルールが正しく設定されているか確認してください。また、認証済みユーザーでログインしているかを確認してください。

### 環境変数が読み込まれない

`.env` ファイルがプロジェクトのルートディレクトリに配置されているか確認してください。また、アプリを再起動して環境変数を再読み込みしてください。

## セキュリティに関する注意事項

本番環境では、以下のセキュリティ対策を実施することを推奨します。

- Firestoreセキュリティルールをより厳格に設定する
- Firebase App Checkを有効化して、不正なアクセスを防ぐ
- APIキーの使用を制限する（Firebase Console > プロジェクト設定 > APIキー）
- 定期的にFirebaseのセキュリティルールを見直す

## 参考リンク

- [Firebase公式ドキュメント](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firestoreセキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
