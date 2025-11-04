# 生产环境部署指南

## 📋 部署前检查清单

### 1. 环境变量配置

**重要**：`.env.local` 文件不会被提交到 Git（已在 .gitignore 中），需要在生产环境单独配置。

#### 必需的环境变量：

```bash
# OpenRouter API (用于 Gemini)
OPENROUTER_API_KEY=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

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://hvcgifssvhcadouvssjf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2dpZnNzdmhjYWRvdXZzc2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDI5MzMsImV4cCI6MjA3NzQ3ODkzM30.shcLhTMVGATa5UujuOXDeGkagin_HKHLYbOvdfZwCOQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2dpZnNzdmhjYWRvdXZzc2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkwMjkzMywiZXhwIjoyMDc3NDc4OTMzfQ.IMDKZQaVAc50r5z6hiujUFTFMV2ZnCnedsh-k0TeEsU

# Creem 支付配置 - ⚠️ 生产环境需要使用正式 API Key
CREEM_API_KEY=creem_live_YOUR_LIVE_API_KEY  # ⚠️ 替换为正式 Key
CREEM_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # ⚠️ 替换为正式 Secret
```

---

## 🚀 部署步骤

### 方式 1：Netlify 部署（推荐，已配置）

#### A. 连接 GitHub 仓库

1. 登录 https://app.netlify.com
2. 点击 **Add new site** → **Import an existing project**
3. 选择 **GitHub** 并授权
4. 选择你的仓库 `nano-banana-clone`

#### B. 配置构建设置

Netlify 会自动读取 `netlify.toml`，但需要确认：

- **Build command**: `bun run build` 或 `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18 或更高

如果没有 Bun，改为使用 npm：

**更新 netlify.toml**：

```toml
[build]
  command = "npm run build"  # 改为 npm
  publish = ".next"
```

#### C. 配置环境变量

1. 在 Netlify 项目中，进入 **Site settings** → **Environment variables**
2. 点击 **Add a variable**
3. 逐个添加上面的所有环境变量

**重要的环境变量**：
- `OPENROUTER_API_KEY` ✅ 保持不变
- `NEXT_PUBLIC_SUPABASE_URL` ✅ 保持不变
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ 保持不变
- `SUPABASE_SERVICE_ROLE_KEY` ✅ 保持不变
- `CREEM_API_KEY` ⚠️ **必须改为正式 Key**（去掉 `_test_`）
- `CREEM_WEBHOOK_SECRET` ⚠️ **必须改为正式 Secret**

#### D. 部署

1. 点击 **Deploy site**
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，你会得到一个 URL，例如：
   ```
   https://your-site-name.netlify.app
   ```

---

### 方式 2：Vercel 部署

#### A. 连接 GitHub 仓库

1. 登录 https://vercel.com
2. 点击 **Add New** → **Project**
3. 导入 GitHub 仓库

#### B. 配置环境变量

在 **Environment Variables** 部分添加所有环境变量。

#### C. 配置构建设置

- **Framework Preset**: Next.js
- **Build Command**: 自动检测
- **Output Directory**: 自动检测

---

## ⚙️ 部署后配置

### 1. 获取 Creem 正式 API Key（重要！）

当前使用的是测试 Key (`creem_test_...`)，生产环境必须使用正式 Key。

1. 登录 https://creem.io/dashboard
2. 进入 **Developers** → **API Keys**
3. 切换到 **Live** 模式（不是 Test 模式）
4. 创建或复制 **Live API Key**（格式：`creem_live_...`）
5. 在 Netlify/Vercel 环境变量中更新 `CREEM_API_KEY`

---

### 2. 更新 Creem Webhook URL（关键！）

部署后，必须将 Webhook URL 从 ngrok 改为生产域名。

1. 登录 https://creem.io/dashboard
2. 进入 **Developers** → **Webhooks**
3. 找到你的 Webhook 配置
4. 将 URL 从：
   ```
   https://your-ngrok-url.ngrok.io/api/payment/webhook
   ```

   改为（假设你的生产域名是）：
   ```
   https://your-site-name.netlify.app/api/payment/webhook
   ```

   或：
   ```
   https://nanobanana.yangzai.ai/api/payment/webhook
   ```

5. 确保勾选了这些事件：
   - ✅ `checkout.completed`
   - ✅ `payment.succeeded`（可选）
   - ✅ `subscription.created`（可选）

6. 保存配置

---

### 3. 更新 Supabase 重定向 URLs

1. 登录 https://supabase.com/dashboard
2. 选择项目 `hvcgifssvhcadouvssjf`
3. 进入 **Authentication** → **URL Configuration**
4. 添加生产域名到 **Site URL** 和 **Redirect URLs**：

   **Site URL**:
   ```
   https://your-site-name.netlify.app
   ```

   **Redirect URLs**（添加这些）:
   ```
   https://your-site-name.netlify.app
   https://your-site-name.netlify.app/api/auth/callback
   ```

5. 保存

---

### 4. 测试 Creem Webhook（重要！）

部署完成后，必须测试 webhook 是否正常工作：

1. 在 Creem Dashboard 中，进入 Webhook 配置页面
2. 点击 **Test** 或 **Send Test Webhook**
3. 选择 `checkout.completed` 事件
4. 发送测试

**验证**：
- 在 Creem Dashboard 中查看 Webhook 日志，应该返回 `200 OK`
- 在 Netlify 部署日志中查看 Function logs
- 如果使用 Netlify，可以在 **Functions** 标签查看实时日志

---

## 🔒 安全检查

### 1. 确认 .env.local 不会被提交

运行：
```bash
git status
```

应该看不到 `.env.local` 文件。如果看到了，说明它没有被忽略。

### 2. 检查 .gitignore

确认包含：
```
.env*
```

这会忽略所有 `.env` 开头的文件。

### 3. 敏感信息检查

**绝对不要提交这些到 Git**：
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `CREEM_API_KEY`
- ❌ `CREEM_WEBHOOK_SECRET`
- ❌ `OPENROUTER_API_KEY`

如果不小心提交了，立即：
1. 在 Supabase/Creem/OpenRouter 中重置密钥
2. 使用 `git filter-branch` 或 `BFG Repo-Cleaner` 清除 Git 历史

---

## 📊 生产环境 vs 开发环境对比

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| **Creem API Key** | `creem_test_...` | `creem_live_...` ⚠️ |
| **Webhook URL** | `https://xxx.ngrok.io/api/payment/webhook` | `https://your-domain.com/api/payment/webhook` ⚠️ |
| **Creem Webhook Secret** | Test secret | Live secret ⚠️ |
| **Supabase Keys** | 相同 ✅ | 相同 ✅ |
| **OpenRouter Key** | 相同 ✅ | 相同 ✅ |
| **环境变量位置** | `.env.local` 文件 | Netlify/Vercel 环境变量 ⚠️ |

---

## 🧪 部署后测试清单

### 1. 基本功能测试

- [ ] 访问首页加载正常
- [ ] GitHub/Google 登录正常
- [ ] 图片生成功能正常
- [ ] Pricing 页面显示正常

### 2. 支付流程测试

- [ ] 点击 "Subscribe Now" 跳转到 Creem
- [ ] 完成支付（使用测试卡号）
- [ ] 返回应用后查看订阅信息
- [ ] 订阅数据正确保存到 Supabase

**Creem 测试卡号**（如果支持）：
- Card: `4242 4242 4242 4242`
- Expiry: 任意未来日期
- CVC: 任意 3 位数字

### 3. Webhook 测试

- [ ] Creem Dashboard 显示 webhook 发送成功（200 OK）
- [ ] Supabase `subscriptions` 表中有新记录
- [ ] 用户能在 `/subscription` 页面看到订阅信息

---

## 🐛 常见问题排查

### 问题 1：部署后支付不工作

**可能原因**：
- Creem Webhook URL 没有更新
- 使用了测试 API Key 而不是正式 Key

**解决方案**：
1. 检查 Netlify 环境变量中的 `CREEM_API_KEY`
2. 检查 Creem Dashboard 中的 Webhook URL

---

### 问题 2：登录后跳转失败

**可能原因**：
- Supabase Redirect URLs 没有配置生产域名

**解决方案**：
在 Supabase Dashboard 中添加生产域名到 Redirect URLs

---

### 问题 3：图片生成失败

**可能原因**：
- `OPENROUTER_API_KEY` 没有配置
- API 额度用完

**解决方案**：
检查 Netlify 环境变量和 OpenRouter 账户余额

---

### 问题 4：Webhook 返回 500 错误

**可能原因**：
- `SUPABASE_SERVICE_ROLE_KEY` 没有配置
- 数据库表不存在

**解决方案**：
1. 检查 Netlify 环境变量
2. 在 Supabase 中运行迁移 SQL

---

## 📝 部署后的维护

### 1. 监控 Webhook

定期检查 Creem Dashboard 中的 Webhook 日志，确保：
- 所有 webhook 都成功（200 OK）
- 没有频繁的失败

### 2. 监控数据库

在 Supabase Dashboard 中定期检查：
- `subscriptions` 表数据是否正常增长
- 没有异常的 `status` 值

### 3. 切换到生产 API Key

测试完成后，记得：
1. 在 Creem 中切换到 **Live** 模式
2. 使用真实的支付信息测试
3. 更新环境变量为正式 Key

---

## ✅ 部署完成检查

- [ ] 代码推送到 GitHub
- [ ] Netlify/Vercel 部署成功
- [ ] 所有环境变量已配置
- [ ] Creem Webhook URL 已更新为生产域名
- [ ] Creem API Key 改为正式 Key（如果上线）
- [ ] Supabase Redirect URLs 已添加生产域名
- [ ] 测试完整支付流程
- [ ] 验证订阅数据正确保存

---

## 🎉 完成！

部署完成后，你的应用就可以在生产环境运行了。

**生产地址示例**：
```
https://your-site-name.netlify.app
或
https://nanobanana.yangzai.ai
```

需要帮助？查看：
- Netlify 部署日志
- Creem Webhook 日志
- Supabase 数据库
- 浏览器控制台
