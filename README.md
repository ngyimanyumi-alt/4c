# 4C 班務管理（GitHub Pages + Supabase Demo）

這個網站是 **純靜態前端**，以 `index.html` 作為 GitHub Pages 入口，並透過 `.github/workflows/deploy-pages.yml` 在部署時產生 `config.js`。

網站提供：

- 粉紅主題預設，以及天空藍 / 紫羅蘭 / 翡翠綠主題切換
- 日期顯示、香港假期 / 週末提示
- 值日生卡片、上一天 / 下一天 / 回到今天
- 學生名單、缺席統計、批量匯入
- 提醒事項
- 常用連結
- 告假信生成器
- 老師 / 學生模式

## 老師模式 demo 密碼

- 老師模式密碼固定為 **`23896299`**
- 這只是一個**公開前端 demo 的基本防誤觸**
- **不是安全登入，也不是身份驗證**
- 正式用途請改用 **Supabase Auth** 或其他真正的登入機制

## Supabase 共享資料說明

網站不使用 `localStorage`、`sessionStorage` 或 `IndexedDB`。

- **已設定 Supabase**：所有訪客會看到相同的共享資料
- **未設定 Supabase**：網站仍會顯示完整漂亮 UI 與預設示範資料，但示範資料只存在於當前頁面記憶體，不會同步

目前資料表對應如下：

- `students` ↔ 學生名單 / 缺席統計
- `todos` ↔ 提醒事項
- `custom_links` ↔ 常用連結
- `duty_overrides` ↔ 值日偏移設定

## 建立 Supabase

1. 到 [Supabase](https://supabase.com/) 建立 project
2. 開啟 **SQL Editor**
3. 把 `/supabase/schema.sql` 內容貼上並執行

> `schema.sql` 目前是公開 demo 用 RLS，方便任何訪客讀寫 4C 的資料。

## GitHub Actions / GitHub Pages 設定

這個 repository 會由 GitHub Pages workflow 產生 `config.js`，**不需要手動提交 `config.js`**。

### Repository Variables

到 **Settings → Secrets and variables → Actions → Variables** 新增：

- `SUPABASE_URL`：例如 `https://your-project-id.supabase.co`
- `CLASS_ID`：可選，預設 `4C`

### Repository Secrets

到 **Settings → Secrets and variables → Actions → Secrets** 新增：

- `SUPABASE_ANON_KEY`：Supabase 的 publishable / anon key

### 重要

- `SUPABASE_URL` 讀自 **GitHub Actions Variables**
- `SUPABASE_ANON_KEY` 讀自 **GitHub Actions Secrets**
- **不要提交** `service_role`、secret key 或任何私密金鑰
- workflow 會保留 `index.html`、`app.js`、`supabase-data.js` 並自動輸出 `config.js`

## 部署

1. 到 repository **Settings → Pages**
2. Source 選 **GitHub Actions**
3. 到 **Actions → Deploy static site to GitHub Pages**
4. 執行 workflow（或 push 到 `main`）
5. 成功後網站會部署到：

```text
https://ngyimanyumi-alt.github.io/4c/
```

如果 `SUPABASE_URL` 或 `SUPABASE_ANON_KEY` 未設定，網站仍可開啟，但會顯示示範資料提示。

## Demo RLS 警告

目前這個公開網站資料：

- 可被任何訪客讀取
- 在 demo RLS 設定下，也可被任何訪客修改

這只適合小型示範用途。

### 正式用途建議

正式使用前請至少改為：

1. 啟用 **Supabase Auth**
2. 將 RLS 改成只允許已登入且授權的使用者修改
3. 視需要加入老師 / 學生不同權限

## 本機檢查

這個 repo 目前沒有自動化測試框架；可先做 JavaScript 語法檢查：

```bash
node --check app.js
node --check supabase-data.js
```
