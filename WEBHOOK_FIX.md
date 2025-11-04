# Webhook 订阅数据保存修复指南

## 问题原因

用户支付成功后，webhook 无法保存订阅数据到 Supabase，原因是：

1. **RLS 权限问题**：Webhook 使用的是普通 Supabase client（Anon Key），受到 Row Level Security (RLS) 限制
2. **无用户会话**：Webhook 请求来自 Creem 服务器，没有用户登录会话，无法通过 RLS 策略
3. **需要 Service Role**：需要使用 Service Role Key 创建管理员权限的 Supabase client，才能绕过 RLS 写入数据

## 已完成的修复

✅ 创建了 Admin Client (`src/lib/supabase/admin.ts`)
✅ 更新了 webhook 处理器使用 Admin Client
✅ 增强了日志记录便于调试
✅ 在 `.env.local` 中添加了 `SUPABASE_SERVICE_ROLE_KEY` 占位符

## ⚠️ 你需要完成的步骤

### 步骤 1：获取 Supabase Service Role Key

1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目：`hvcgifssvhcadouvssjf`
3. 进入 **Settings** → **API**
4. 在 **Project API keys** 部分找到以下密钥：

   ```
   Project URL: https://hvcgifssvhcadouvssjf.supabase.co ✅ (已有)
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅ (已有)
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ⚠️ (需要复制这个!)
   ```

5. 点击 **service_role** 右侧的 👁️ (眼睛图标) 查看完整密钥
6. 点击复制按钮复制完整的 service_role key

### 步骤 2：更新 `.env.local` 文件

打开 `.env.local` 文件，找到这一行：

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

替换 `your_service_role_key_here` 为你刚才复制的 service_role key：

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2dpZnNzdmhjYWRvdXZzc2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkwMjkzMywiZXhwIjoyMDc3NDc4OTMzfQ.很长的字符串...
```

### 步骤 3：重启开发服务器

环境变量需要重启才能生效：

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
npm run dev
```

### 步骤 4：测试支付流程

1. 访问 http://localhost:3000/pricing
2. 选择任意计划并点击 "Subscribe Now"
3. 完成 Creem 测试支付
4. 支付成功后，返回应用
5. 点击头像下拉菜单 → "My Subscription"
6. 应该能看到你的订阅信息！

## 如何验证 Webhook 是否工作

### 方法 1：查看控制台日志

开发服务器会输出详细的 webhook 日志：

```
[Webhook] Processing checkout.session.completed: { ... }
[Webhook] Extracted data: { userId: '...', planType: 'monthly', ... }
[Webhook] Plan details: { planName: 'pro', creditsTotal: 800 }
[Webhook] Period: { start: '2025-...', end: '2025-...' }
[Webhook] Attempting to upsert subscription: { ... }
[Webhook] Subscription created successfully: [ { id: '...', ... } ]
```

### 方法 2：直接查看 Supabase 数据库

1. 登录 Supabase Dashboard
2. 进入 **Table Editor**
3. 选择 `subscriptions` 表
4. 应该能看到新创建的订阅记录

### 方法 3：查看 Creem Webhook 日志

1. 登录 Creem Dashboard：https://creem.io/dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击你配置的 webhook
4. 查看最近的 webhook 请求和响应
5. 成功的请求应该返回 `200 OK` 和 `{ "received": true }`

## 常见问题排查

### ❌ 问题 1：仍然没有订阅数据

**检查清单：**
- [ ] Service Role Key 是否正确复制（完整的，很长的字符串）
- [ ] `.env.local` 文件是否保存
- [ ] 开发服务器是否重启
- [ ] 控制台是否有错误日志

**查看日志：**
```bash
# 如果看到这个错误：
[Webhook] Error creating subscription: { ... }

# 说明 Service Role Key 可能配置不正确
```

### ❌ 问题 2：Webhook 未触发

**可能原因：**
1. Webhook URL 配置错误（本地开发需要 ngrok 等工具）
2. Webhook secret 不匹配
3. Creem 发送的事件类型不是 `checkout.session.completed`

**解决方案：**
- 本地开发时，使用 ngrok 暴露本地端口：
  ```bash
  ngrok http 3000
  # 将生成的 URL (https://xxx.ngrok.io) 配置到 Creem webhook
  ```

### ❌ 问题 3：RLS 权限错误

**错误信息：**
```
new row violates row-level security policy for table "subscriptions"
```

**解决方案：**
- 确保使用的是 `createAdminClient()` 而不是 `createClient()`
- Service Role Key 可以绕过所有 RLS 策略

## 安全提示

⚠️ **Service Role Key 非常重要！**

- ✅ **可以**：在服务器端 API 路由中使用（如 webhook）
- ❌ **绝不**：暴露在客户端代码中
- ❌ **绝不**：提交到公开的 Git 仓库
- ❌ **绝不**：在环境变量名前加 `NEXT_PUBLIC_` 前缀

如果 Service Role Key 泄露：
1. 立即在 Supabase Dashboard 中重置它
2. 更新 `.env.local` 和生产环境变量
3. 重新部署应用

## 代码变更总结

### 新文件：
- `src/lib/supabase/admin.ts` - Admin client 用于 webhook

### 修改文件：
- `src/app/api/payment/webhook/route.ts` - 使用 Admin client 并增强日志
- `.env.local` - 添加 `SUPABASE_SERVICE_ROLE_KEY`

### 关键代码：

**Admin Client 创建：**
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 绕过 RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

**Webhook 使用 Admin Client：**
```typescript
// src/app/api/payment/webhook/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

async function handleCheckoutCompleted(data: any) {
  const supabase = createAdminClient() // 使用 Admin Client，不是普通 client

  const { data: insertedData, error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData)
    .select()

  // ...
}
```

## 完成后

配置完成后，支付流程应该是这样的：

1. 用户在 `/pricing` 选择计划 → 跳转到 Creem 支付页面
2. 用户完成支付 → Creem 发送 webhook 到你的服务器
3. Webhook 处理器接收数据 → 使用 Admin Client 保存到 Supabase
4. 用户返回应用 → 点击 "My Subscription" → 看到订阅信息 ✅

如有问题，查看控制台日志或 Supabase 表编辑器中的数据！
