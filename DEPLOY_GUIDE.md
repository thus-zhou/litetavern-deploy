# ☁️ LiteTavern Pro 云端部署指南

本指南将指导您如何将项目部署到免费的云服务上，实现“一次部署，永久访问”。

我们采用 **前后端分离** 的部署策略：
*   **后端 (Python)**: 部署在 [Render.com](https://render.com) (或 Fly.io)
*   **前端 (React)**: 部署在 [Vercel.com](https://vercel.com)

---

## 第一步：准备代码仓库

1.  在 **GitHub** 上创建一个新的私有仓库（例如 `litetavern-deploy`）。
2.  将本地代码推送到 GitHub：
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/您的用户名/litetavern-deploy.git
    git push -u origin main
    ```

---

## 第二步：部署后端 (Render)

Render 提供免费的容器托管服务。

1.  注册并登录 [Render Dashboard](https://dashboard.render.com/)。
2.  点击 **"New +"** -> **"Web Service"**。
3.  选择 **"Build and deploy from a Git repository"**，连接您的 GitHub 仓库。
4.  **配置参数**:
    *   **Name**: `litetavern-backend`
    *   **Region**: 选择离您近的 (如 Singapore 或 Oregon)。
    *   **Runtime**: **Docker** (重要！不要选 Python)。
    *   **Instance Type**: Free。
5.  点击 **"Create Web Service"**。
6.  等待几分钟，部署完成后，Render 会给您一个 URL（例如 `https://litetavern-backend.onrender.com`）。**请复制这个网址**。

> ⚠️ **关于数据库的重要提示**: 
> Render 的免费层在重启后会**重置文件系统**。这意味着 `users.db` 会被清空。
> *   **测试用**: 没问题，账号没了重新注册即可。
> *   **长期用**: 建议使用 [Fly.io](https://fly.io) (支持挂载免费硬盘) 或在 Render 上升级为付费版。

---

## 第三步：部署前端 (Vercel)

Vercel 是最强的前端托管平台。

1.  注册并登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2.  点击 **"Add New..."** -> **"Project"**。
3.  导入同一个 GitHub 仓库。
4.  **配置参数**:
    *   **Framework Preset**: Vite (通常会自动识别)。
    *   **Root Directory**: 点击 Edit，选择 `frontend` 文件夹。
5.  **修改 `vercel.json`**:
    *   项目根目录下的 `frontend/vercel.json` 文件中，找到 `"destination": "https://YOUR_BACKEND_URL/api/:path*"`。
    *   **必须修改代码并重新提交**: 将 `YOUR_BACKEND_URL` 替换为您在第二步获得的 Render 网址 (例如 `https://litetavern-backend.onrender.com`)。
    *   *(或者在 Vercel 部署完成后，在 Project Settings -> Rewrites 中手动配置)*
6.  点击 **"Deploy"**。
7.  部署完成后，Vercel 会提供一个访问域名（例如 `litetavern.vercel.app`）。

---

## 第四步：完成！

现在，您可以访问 Vercel 提供的网址：
1.  **无需开电脑**: 服务 24 小时在线。
2.  **手机访问**: 直接打开网址，体验极佳。
3.  **分享**: 发给朋友链接，他们也能注册使用（数据存在云端）。

## 💡 进阶：如何解决“注册/登录失败”？
(Vercel 环境配置指南)

如果您的前端在 Vercel，后端在 Render，请务必执行以下步骤：

1. **设置环境变量 (Vercel)**
   * 进入 Vercel 项目设置 -> **Settings** -> **Environment Variables**。
   * 添加 Key: `VITE_API_URL`
   * 添加 Value: `https://litetavern-backend.onrender.com`
   * **重要**: 添加后，必须去 **Deployments** 页面重新 Redeploy 才会生效！

2. **设置环境变量 (Render)**
   * 进入 Render 后端服务 -> **Environment**。
   * 添加 Key: `ALLOWED_ORIGINS`
   * 添加 Value: 您的 Vercel 网址 (例如 `https://litetavern.vercel.app`)，如果有多个用逗号分隔。如果不确定，可以暂时填 `*` (仅用于测试)。

3. **关于 vercel.json**
   * 项目中的 `frontend/vercel.json` 已经帮您配置好了 Rewrites。这意味着您的前端请求 `/api/xxx` 会自动转发到 Render。
   * **但是**，有些代码可能直接使用了 `fetch(API_URL + ...)`，所以第1步的环境变量依然非常重要。

---

## 💡 进阶方案：使用 Fly.io (解决数据库丢失问题)

如果您希望免费且数据不丢失，推荐使用 Fly.io。

1.  安装 `flyctl` 命令行工具。
2.  在项目根目录运行 `fly launch`。
3.  在配置过程中，添加一个 **Volume** (卷) 并挂载到 `/app` 目录，这样 `users.db` 就会被持久保存了。
