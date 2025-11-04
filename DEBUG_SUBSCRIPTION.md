# 数据库表检查和修复指南

## 问题：订阅数据没有保存

可能的原因：
1. ✅ Service Role Key 已配置
2. ❓ 数据库表可能没有创建
3. ❓ Webhook 可能没有被调用
4. ❓ RLS 策略可能有问题

## 步骤 1：检查数据库表是否存在

### 方法 A：在 Supabase Dashboard 中检查

1. 登录 https://supabase.com/dashboard
2. 选择项目 `hvcgifssvhcadouvssjf`
3. 进入 **Table Editor**
4. 查看左侧是否有 `subscriptions` 和 `usage_logs` 表

**如果表不存在，继续下一步。**

### 方法 B：执行 SQL 创建表

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase/migrations/001_create_subscriptions_table.sql` 中的所有内容
4. 粘贴到 SQL 编辑器
5. 点击 **Run** 执行
6. 如果成功，应该看到 "Success. No rows returned"

## 步骤 2：测试数据库写入

### 使用测试端点验证

已创建测试端点 `/api/test-subscription`，可以用来：

#### 2.1 查看所有订阅（管理员视图）

```bash
# 在浏览器访问或使用 curl
GET http://localhost:3000/api/test-subscription
```

**预期响应：**
```json
{
  "success": true,
  "message": "Successfully fetched subscriptions",
  "count": 0,
  "subscriptions": []
}
```

如果出现错误，说明表可能不存在或 Service Role Key 配置错误。

#### 2.2 创建测试订阅

```bash
# 需要先登录，然后访问
POST http://localhost:3000/api/test-subscription
```

**预期响应：**
```json
{
  "success": true,
  "message": "Test subscription created successfully",
  "subscription": { ... }
}
```

#### 2.3 删除测试数据

```bash
DELETE http://localhost:3000/api/test-subscription
```

## 步骤 3：验证 Webhook 是否被调用

### 检查 Creem Webhook 配置

1. 登录 https://creem.io/dashboard
2. 进入 **Developers** → **Webhooks**
3. 确认 Webhook URL 配置正确：
   - **本地开发**：需要使用 ngrok 等工具
   - **生产环境**：https://yourdomain.com/api/payment/webhook
4. 确认订阅的事件包括：
   - ✅ `checkout.session.completed`
   - ✅ `payment.succeeded`
   - ✅ `subscription.created`

### 本地测试 Webhook（使用 ngrok）

```bash
# 安装 ngrok (如果还没有)
# Windows: choco install ngrok
# Mac: brew install ngrok

# 启动 ngrok
ngrok http 3000

# 会看到类似这样的输出：
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

然后在 Creem Dashboard 中：
1. 更新 Webhook URL 为：`https://abc123.ngrok.io/api/payment/webhook`
2. 保存并重新测试支付

### 查看开发服务器日志

完成支付后，在终端应该看到类似这样的日志：

```
[Webhook] Processing checkout.session.completed: { ... }
[Webhook] Extracted data: { userId: '...', planType: 'monthly', ... }
[Webhook] Plan details: { planName: 'pro', creditsTotal: 800 }
[Webhook] Attempting to upsert subscription: { ... }
[Webhook] Subscription created successfully: [ { id: '...', ... } ]
```

**如果没有任何日志输出**，说明 Webhook 没有被调用。

## 步骤 4：手动测试数据插入

如果自动化流程有问题，可以手动测试：

### 在 Supabase SQL Editor 中执行：

```sql
-- 获取你的 user_id（先登录应用，然后查看）
SELECT id, email FROM auth.users LIMIT 5;

-- 手动插入测试订阅（替换 'your-user-id' 为实际的 user_id）
INSERT INTO public.subscriptions (
  user_id,
  creem_subscription_id,
  plan_name,
  plan_type,
  product_id,
  amount,
  currency,
  status,
  current_period_start,
  current_period_end,
  credits_total,
  credits_used
) VALUES (
  'your-user-id',
  'manual_test_sub_123',
  'pro',
  'monthly',
  'prod_test',
  39.00,
  'USD',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  800,
  0
);

-- 查询刚插入的数据
SELECT * FROM public.subscriptions WHERE creem_subscription_id = 'manual_test_sub_123';
```

如果手动插入成功，说明数据库表是正常的，问题在于：
- Webhook 没有被调用，或
- Webhook 处理逻辑有问题

## 步骤 5：调试 Webhook

### 添加详细日志

Webhook 处理器已经包含详细日志，确保开发服务器在运行时能看到所有输出。

### 检查常见问题

1. **user_id 传递问题**
   - 检查 `/api/payment/create-checkout` 是否正确传递 `user_id` 到 metadata
   - 在控制台应该看到：`[Webhook] Extracted data: { userId: '...' }`

2. **product_id 映射问题**
   - 检查 product_id 是否包含 'basic', 'pro', 或 'max'
   - 如果都不包含，默认使用 'pro' 和 800 credits

3. **Service Role Key 权限**
   - 确保使用的是正确的 Service Role Key
   - 尝试访问 `/api/test-subscription` GET 端点验证

## 快速测试流程

1. ✅ 重启开发服务器：`npm run dev`
2. ✅ 访问 http://localhost:3000/api/test-subscription （查看表是否可访问）
3. ✅ 登录应用
4. ✅ 访问 http://localhost:3000/api/test-subscription （POST 创建测试订阅）
5. ✅ 访问 http://localhost:3000/subscription （查看是否显示订阅）

如果步骤 4 成功但实际支付后没有数据，问题就在 Webhook 调用上。

## 解决方案总结

### 如果表不存在
→ 在 Supabase SQL Editor 执行迁移 SQL

### 如果 Service Role Key 错误
→ 重新复制正确的 key 到 `.env.local`

### 如果 Webhook 没被调用
→ 使用 ngrok 并更新 Creem Webhook URL

### 如果 Webhook 调用但没保存
→ 查看终端日志，找到具体错误信息

需要我帮你执行哪一步？
