# Device Manager

社内QAチーム向けのモバイル端末管理アプリケーションです。端末の自動登録、貸出管理、検索機能を提供し、新人QAエンジニアの教育題材としても使用できます。

## 主な機能

Device Managerは、QAチームが保有するモバイル端末を効率的に管理するための包括的な機能を提供します。認証機能により、チームメンバーは安全にログインし、端末情報にアクセスできます。端末一覧画面では、登録されているすべての端末を確認でき、検索やフィルタ機能により目的の端末を素早く見つけることができます。

端末登録機能は本アプリの最重要機能であり、アプリをインストールした端末自身の情報を自動的に取得してデータベースに登録できます。expo-deviceパッケージを使用して、OS名・バージョン、内部モデルID、物理メモリ、UUIDなどの情報を自動取得し、iOSの内部ID（例: iPhone15,3）を人間が読める名称（例: iPhone 15 Pro Max）に変換するマッピング機能も実装されています。

貸出・返却管理機能により、端末の利用状況をリアルタイムで把握できます。排他制御により、既に貸出中の端末は他のユーザーが借りることができないようになっています。マイデバイス画面では、自分が現在借りている端末を一覧表示し、簡単に返却操作を行うことができます。

## 技術スタック

本アプリケーションは、以下の技術スタックで構築されています。

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React Native (Expo SDK 54) |
| 言語 | TypeScript 5.9 |
| バックエンド | Firebase (Authentication, Firestore) |
| 状態管理 | React Hooks |
| ナビゲーション | Expo Router 6 |
| デザインシステム | Material 3 inspired |
| 端末情報取得 | expo-device |

## プロジェクト構成

プロジェクトは以下のディレクトリ構成で整理されています。

```
device-manager/
├── app/                    # Expo Routerによる画面定義
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # ホーム画面（端末一覧）
│   │   ├── my-devices.tsx # マイデバイス画面
│   │   └── profile.tsx    # プロフィール画面
│   ├── device/            # 端末詳細画面
│   │   └── [id].tsx       # 動的ルート
│   ├── login.tsx          # ログイン画面
│   └── register-device.tsx # 端末登録画面
├── components/            # 再利用可能なコンポーネント
│   ├── device-card.tsx    # 端末カードコンポーネント
│   ├── status-badge.tsx   # ステータスバッジ
│   └── auth-guard.tsx     # 認証ガード
├── services/              # ビジネスロジック
│   ├── device-service.ts  # 端末関連のFirestore操作
│   └── user-service.ts    # ユーザー関連のFirestore操作
├── hooks/                 # カスタムフック
│   └── use-firebase-auth.ts # Firebase認証フック
├── utils/                 # ユーティリティ関数
│   └── device-info.ts     # 端末情報取得ユーティリティ
├── types/                 # TypeScript型定義
│   └── device.ts          # デバイス・ユーザー型定義
├── data/                  # 静的データ
│   ├── ios-models.json    # iOSモデル名マッピング
│   └── android-models.json # Androidモデル名マッピング
├── lib/                   # ライブラリ設定
│   └── firebase.ts        # Firebase初期化
└── docs/                  # ドキュメント
    └── FIREBASE_SETUP.md  # Firebase設定手順書
```

## セットアップ手順

### 1. 依存関係のインストール

プロジェクトのルートディレクトリで以下のコマンドを実行し、必要なパッケージをインストールします。

```bash
pnpm install
```

### 2. Firebase設定

Firebase プロジェクトを作成し、Authentication と Firestore を有効化します。詳細な手順は `docs/FIREBASE_SETUP.md` を参照してください。

プロジェクトのルートディレクトリに `.env` ファイルを作成し、Firebase設定情報を記述します。

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### 3. アプリの起動

開発サーバーを起動します。

```bash
pnpm dev
```

Expo Goアプリをインストールした実機でQRコードをスキャンし、アプリを起動します。

## 使用方法

### 初回ログイン

アプリを起動すると、ログイン画面が表示されます。初回利用時は「新規登録」を選択し、メールアドレスとパスワードを入力してアカウントを作成します。作成したユーザーは自動的に「一般ユーザー」権限で登録されます。

### 端末の登録

ホーム画面右下のフローティングアクションボタン（+アイコン）をタップし、端末登録画面を開きます。アプリが自動的に現在の端末情報を取得し、フォームに入力されます。機種名や画面サイズなど、必要に応じて情報を編集し、「登録」ボタンをタップします。

### 端末の検索とフィルタ

ホーム画面上部の検索バーに機種名やOSバージョンを入力すると、リアルタイムで端末が絞り込まれます。フィルタボタンをタップすると、ステータス（利用可/貸出中/すべて）で絞り込むことができます。

### 端末の貸出と返却

端末カードをタップして詳細画面を開きます。利用可能な端末の場合は「借りる」ボタンが表示され、タップすると貸出処理が実行されます。自分が借りている端末の場合は「返す」ボタンが表示され、タップすると返却処理が実行されます。

### マイデバイスの確認

画面下部のタブバーから「マイデバイス」タブを選択すると、自分が現在借りている端末の一覧が表示されます。ここから直接端末詳細画面に遷移し、返却操作を行うことができます。

## データモデル

### Device（端末）

端末情報は以下のフィールドで構成されています。

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | string | 端末ID（自動生成） |
| modelName | string | 機種名（例: iPhone 14 Pro Max） |
| internalModelId | string | 内部モデルID（例: iPhone15,3） |
| osName | string | OS名（iOS/Android） |
| osVersion | string | OSバージョン（例: 17.2） |
| manufacturer | string | メーカー名 |
| screenSize | string | 画面サイズ（任意） |
| physicalMemory | string | 物理メモリ（任意） |
| uuid | string | 端末固有ID |
| status | DeviceStatus | ステータス（available/in_use） |
| currentUserId | string | 現在の利用者ID（貸出中のみ） |
| currentUserName | string | 現在の利用者名（貸出中のみ） |
| borrowedAt | Date | 貸出開始日時（貸出中のみ） |
| memo | string | メモ（任意） |
| registeredBy | string | 登録者のユーザーID |
| registeredAt | Date | 登録日時 |
| updatedAt | Date | 更新日時 |

### User（ユーザー）

ユーザー情報は以下のフィールドで構成されています。

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | string | ユーザーID（Firebase Auth UID） |
| email | string | メールアドレス |
| name | string | 表示名（任意） |
| role | UserRole | 権限（admin/user） |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

## QAエンジニア教育への活用

本アプリケーションは、新人QAエンジニアの教育題材として以下の観点で活用できます。

### テストケース作成の練習

端末登録機能、貸出・返却機能、検索・フィルタ機能など、様々な機能に対するテストケースを作成する練習ができます。正常系・異常系・境界値のテストケースを網羅的に考える訓練になります。

### 仕様理解の訓練

ソースコードを読み解き、各機能の仕様を理解する訓練ができます。特に、排他制御ロジックやモデル名マッピングロジックは、仕様理解の良い題材となります。

### バグ探索の実践

意図的にバグを混入させたバージョンを用意し、バグを発見・報告する訓練ができます。例えば、排他制御が機能していない、検索結果が正しくない、などのバグを仕込むことができます。

### コードレビューの練習

Clean Architectureを意識した可読性の高いコードで構成されているため、コードレビューの練習題材として適しています。変数名、関数名、コメント、エラーハンドリングなどの観点でレビューを行うことができます。

## トラブルシューティング

### 端末情報が正しく取得できない

シミュレーター/エミュレーターで実行している場合、一部の端末情報が正しく取得できないことがあります。実機での動作確認を推奨します。

### Firebaseへの接続エラー

`.env` ファイルの設定が正しいか確認してください。また、Firebaseコンソールでプロジェクトが正しく設定されているかを確認してください。

### 貸出・返却ボタンが表示されない

認証状態を確認してください。ログアウトして再度ログインすることで解決する場合があります。

## ライセンス

本プロジェクトはMITライセンスの下で公開されています。

## 開発者

本アプリケーションは、社内QAチームの業務効率化と新人教育を目的として開発されました。

---

**Device Manager v1.0.0**  
社内QAチーム向け端末管理システム
