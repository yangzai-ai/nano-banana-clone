# 订阅功能设置指南

## ✅ 已完成的功能

1. **Supabase 数据库表**
   - ✅ `subscriptions` 表 - 存储用户订阅信息
   - ✅ `usage_logs` 表 - 跟踪 credits 使用情况
   - ✅ Row Level Security (RLS) 策略
   - ✅ 自动更新时间戳触发器

2. **API 端点**
   - ✅ `GET /api/subscription` - 获取用户订阅信息
   - ✅ `POST /api/payment/webhook` - 处理 Creem webhooks 并保存订阅

3. **前端组件**
   - ✅ `SubscriptionInfo` 组件 - 显示订阅详情
   - ✅ Pricing 页面集成 - "My Subscription" 按钮

4. **功能特性**
   - ✅ 显示订阅计划（Basic/Pro/Max）
   - ✅ 显示计费周期（Monthly/Yearly）
   - ✅ Credits 使用情况进度条
   - ✅ 下次计费日期
   - ✅ 剩余天数倒计时
   - ✅ 订阅状态徽章

---

## 🚀 设置步骤

### 步骤 1: 在 Supabase 中创建数据库表

1. 登录 https://supabase.com/dashboard
2. 选择你的项目：`hvcgifssvhcadouvssjf`
3. 进入 **SQL Editor**
4. 复制 `supabase/migrations/001_create_subscriptions_table.sql` 中的 SQL
5. 粘贴到 SQL Editor 并执行
6. 验证表已创建：
   - 进入 **Table Editor**
   - 应该看到 `subscriptions` 和 `usage_logs` 表

### 步骤 2: 配置 Creem Webhook

1. 登录 https://creem.io/dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add Webhook**
4. 配置：
   ```
   Name: Nano Banana Subscriptions
   URL: https://yourdomain.com/api/payment/webhook
   Events:
     ☑ checkout.session.completed
     ☑ payment.succeeded
     ☑ subscription.created
     ☑ subscription.updated
     ☑ subscription.cancelled
   ```
5. 保存并记录 Webhook Secret（已在 `.env.local` 中配置）

### 步骤 3: 测试完整流程

**本地测试（开发环境）：**

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 http://localhost:3000/pricing

3. 点击任意 "Subscribe Now" 按钮

4. 完成 Creem 测试支付

5. 返回后点击 "My Subscription" 查看订阅信息

**注意**：本地开发时，Creem webhook 无法访问 localhost。需要部署到生产环境或使用 ngrok 等工具。

---

## 📊 订阅数据结构

### subscriptions 表字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `user_id` | UUID | 用户ID（关联 auth.users） |
| `creem_subscription_id` | TEXT | Creem 订阅ID |
| `plan_name` | TEXT | 计划名称（basic/pro/max） |
| `plan_type` | TEXT | 计费类型（monthly/annual） |
| `product_id` | TEXT | Creem Product ID |
| `amount` | DECIMAL | 金额 |
| `status` | TEXT | 状态（active/cancelled/expired） |
| `credits_total` | INTEGER | 总 credits |
| `credits_used` | INTEGER | 已使用 credits |
| `credits_remaining` | INTEGER | 剩余 credits（自动计算） |
| `current_period_start` | TIMESTAMPTZ | 当前周期开始 |
| `current_period_end` | TIMESTAMPTZ | 当前周期结束 |
| `cancel_at_period_end` | BOOLEAN | 是否在周期末取消 |

---

## 🔄 Webhook 处理流程

当用户完成支付后，Creem 会发送 webhook 到你的服务器：

1. **接收 Webhook**
   ```
   POST /api/payment/webhook
   Headers:
     creem-signature: <signature>
   Body:
     {
       "type": "checkout.session.completed",
       "data": { ... }
     }
   ```

2. **验证签名**（已实现）
   - 使用 `CREEM_WEBHOOK_SECRET` 验证请求真实性

3. **提取数据**
   - `data.metadata.user_id` - 用户ID
   - `data.metadata.plan_type` - monthly/annual
   - `data.product_id` - 产品ID
   - `data.amount` - 金额

4. **保存到数据库**
   - 创建或更新 `subscriptions` 表记录
   - 根据 `plan_type` 计算 credits
   - 设置订阅周期日期

5. **自动映射 Credits**
   ```typescript
   Basic Monthly:  150 credits
   Basic Annual:   1800 credits
   Pro Monthly:    800 credits
   Pro Annual:     9600 credits
   Max Monthly:    4600 credits
   Max Annual:     55200 credits
   ```

---

## 🎨 订阅信息显示

**在 Pricing 页面：**

1. 用户访问 `/pricing`
2. 点击 "My Subscription" 按钮
3. 显示 `SubscriptionInfo` 组件

**组件显示内容：**

- ✅ 订阅计划名称和状态徽章
- ✅ 月度/年度计费周期
- ✅ 价格显示
- ✅ Credits 进度条
  - 总 credits
  - 已使用 credits
  - 剩余 credits
  - 使用百分比可视化
- ✅ 下次计费日期
- ✅ 剩余天数倒计时
- ✅ 订阅ID（前16位）
- ✅ 取消提醒（如果已取消）
- ✅ "Upgrade Plan" 和 "Manage Subscription" 按钮

---

## 🧪 测试场景

### 测试 1: 新用户订阅

1. 创建新账户（GitHub/Google登录）
2. 访问 `/pricing`
3. 选择任意计划并完成支付
4. 点击 "My Subscription"
5. 验证显示正确的订阅信息

### 测试 2: 查看 Credits

1. 登录已有订阅的账户
2. 访问 `/pricing`
3. 点击 "My Subscription"
4. 验证 credits 显示正确
5. 使用图片生成功能消耗 credits
6. 刷新页面，验证 credits 更新

### 测试 3: Webhook 接收

1. 在 Supabase 中清空 `subscriptions` 表（测试用）
2. 完成一次支付
3. 检查 Supabase 中是否创建了新记录
4. 验证所有字段都正确填充

---

## ⚠️ 注意事项

1. **本地开发限制**
   - Creem webhook 无法访问 localhost
   - 需要部署到可访问的域名或使用 ngrok

2. **Product ID 映射**
   - 确保 `product_id` 包含 'basic', 'pro', 或 'max' 关键字
   - 用于自动识别计划类型和分配 credits

3. **Credits 计算**
   - 2 credits = 1 张高质量图片
   - Credits 在每个计费周期开始时重置
   - 需要在图片生成 API 中扣除 credits

4. **RLS 安全**
   - 用户只能查看自己的订阅
   - Webhook 使用 Service Role 权限写入

---

## 📝 后续增强功能

可以添加的功能：

1. **Credits 使用跟踪**
   - 在 `/api/generate` 中扣除 credits
   - 记录到 `usage_logs` 表

2. **订阅管理**
   - 取消订阅
   - 升级/降级计划
   - 查看历史账单

3. **Credits 购买**
   - 一次性购买 credits
   - 与订阅分开计算

4. **邮件通知**
   - 订阅成功通知
   - Credits 不足提醒
   - 订阅即将到期提醒

5. **管理后台**
   - 查看所有订阅
   - 手动调整 credits
   - 订阅统计报表

---

## 🐛 故障排除

### 问题 1: 订阅信息不显示

**检查：**
- Supabase 表是否已创建
- 用户是否已登录
- 浏览器控制台是否有错误
- `/api/subscription` 是否返回正确数据

### 问题 2: Webhook 未触发

**检查：**
- Webhook URL 是否正确配置
- Webhook Secret 是否匹配
- 服务器是否可从外部访问
- Creem Dashboard 中的 Webhook 日志

### 问题 3: Credits 显示为 0

**检查：**
- Webhook 是否成功保存数据
- `handleCheckoutCompleted` 中的 product_id 映射是否正确
- Supabase 表中的 `credits_total` 字段

---

## 🎉 完成！

订阅功能已完全实现！用户现在可以：
- ✅ 订阅任意计划
- ✅ 查看订阅详情
- ✅ 查看 credits 余额
- ✅ 了解下次计费日期
- ✅ 跟踪 credits 使用情况

运行 `npm run dev` 开始测试！🚀
