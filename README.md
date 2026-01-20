# AI Schedule Sync

書類や画像からスケジュールを抽出し、Googleカレンダーに自動同期するWebアプリ。

## セットアップ

### 1. Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成。
2. **APIとサービス > ライブラリ** から以下を有効化：
   - Google Calendar API
   - Google Drive API (任意)
3. **OAuth 同意画面** を設定。
   - スコープに `.../auth/calendar`, `openid`, `email`, `profile` を追加。
4. **認証情報** から OAuth 2.0 クライアント ID を作成。
   - 承認済みのリダイレクト URI: `http://localhost:3000/api/auth/callback/google`

### 2. Google AI (Gemini)
1. [Google AI Studio](https://aistudio.google.com/) で API キーを取得。

### 3. 環境変数 (.env.local)
`.env.local` ファイルを作成し、以下の値を設定してください。

```env
GOOGLE_CLIENT_ID=あなたのクライアントID
GOOGLE_CLIENT_SECRET=あなたのクライアントシークレット
NEXTAUTH_SECRET=適当なランダムな文字列 (openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=あなたのGeminiキー
```

### 4. 起動
```bash
npm install
npm run dev
```
