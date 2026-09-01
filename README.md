# 4C 班務管理（Supabase 共享版）

這個網站是 **純靜態前端**（可部署到 GitHub Pages），但資料改由 **Supabase** 儲存，讓不同訪客能看到同一份班務資料。

> 重點：只有靜態託管（HTML/JS）本身**無法**同步每個人的修改。若要共享資料，必須連接 Supabase 這類後端。

## 功能資料表

- `students`：學生（學號、姓名、缺席天數）
- `duty_overrides`：按日期/值日欄位的偏移設定
- `todos`：待辦與提醒
- `custom_links`：自訂連結

## 1) 建立 Supabase 專案

1. 到 [Supabase](https://supabase.com/) 建立專案。
2. 在專案中打開 SQL Editor。
3. 將 `/supabase/schema.sql` 貼上並執行。

## 2) 設定前端連線

1. 複製設定檔：
   - 將 `/config.example.js` 複製成 `/config.js` 後再填值（`config.js` 已在 `.gitignore`，不會被提交）。
2. 在 `config.js` 填入：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CLASS_ID`（預設 `4C`）
   - `TEACHER_PASSWORD`（僅示範用；留空會停用老師模式切換）

⚠️ 請勿放入 service-role key 或任何私密金鑰。

## 3) 啟用 GitHub Pages（Workflow）

專案已提供 `.github/workflows/deploy-pages.yml`：

1. 到 GitHub Repo → **Settings** → **Pages**
2. Source 選擇 **GitHub Actions**
3. 在 Repo 設定：
   - **Settings → Secrets and variables → Actions → Variables**：
     - `SUPABASE_URL`
     - `CLASS_ID`（可選，預設 `4C`）
   - **Settings → Secrets and variables → Actions → Secrets**：
     - `SUPABASE_ANON_KEY`
     - `TEACHER_PASSWORD`（可選，可留空）
4. 推送到 `main` 後，workflow 會自動產生 `config.js` 並部署

## 安全性與限制（務必閱讀）

- 目前保留「學生模式 / 老師模式」UX。
- `TEACHER_PASSWORD` 放在前端 JavaScript，**不是安全身份驗證**，只能防誤觸。
- `schema.sql` 目前示範為匿名可寫入（方便公開 demo），任何人理論上都可改資料。
- 正式學校使用前，請改為：
  1. 啟用 **Supabase Auth**
  2. 將寫入 RLS policy 改為只允許已登入且有權限的使用者
  3. 視需要細分老師/學生資料權限

## 本機開啟

此專案是靜態網站，可直接由任何靜態伺服器提供（例如 VS Code Live Server、`python -m http.server` 等）。
