# Creem 支付集成指南

## ✅ 已完成的集成

根据 Creem 官方文档，我们已经完成了以下集成：

### 1. API 配置
- ✅ API Key 已配置：`creem_test_5chb7hfamNbyCHMEW4qJyF`（测试模式）
- ✅ Webhook Secret 已配置：`whsec_2eyduTL6sHiTcyRNYXeARm`

### 2. 核心集成代码
- ✅ `/api/payment/create-checkout` - 创建 Creem checkout 会话
- ✅ `/api/payment/webhook` - 处理 Creem webhooks
- ✅ `/payment/success` - 支付成功页面
- ✅ `/pricing` - 完整定价页面

## 🔑 关键发现：Creem 使用 Product ID，不是 Price ID

与 Stripe 不同，Creem 的架构是：
- **Product ID**：`prod_xxxxx` - 每个产品包含价格信息
- **不需要单独的 Price ID**
- 通过 `units` 参数控制数量和总价

## 📋 需要在 Creem Dashboard 完成的配置

### 步骤 1: 创建产品

你需要在 Creem Dashboard 创建 **6 个产品**（每个方案有月付和年付两个产品）：

| 产品名称 | 价格 | 计费周期 | Product ID 变量名 |
|---------|------|---------|------------------|
| Basic Monthly | $15.00 | Monthly recurring | `prod_basic_monthly` |
| Basic Annual | $144.00 | Yearly recurring | `prod_basic_annual` |
| Pro Monthly | $39.00 | Monthly recurring | 已有：`prod_2zUJFfU5Mc9TT7mSr1OyEo` |
| Pro Annual | $234.00 | Yearly recurring | `prod_pro_annual` |
| Max Monthly | $160.00 | Monthly recurring | `prod_max_monthly` |
| Max Annual | $960.00 | Yearly recurring | `prod_max_annual` |

### 步骤 2: 在 Creem Dashboard 创建产品

1. 登录 https://creem.io/dashboard
2. 进入 **Products** 页面
3. 点击 **Create Product** 按钮
4. 填写产品信息：
   ```
   Name: Pro Monthly
   Description: For professional creators and teams - Monthly billing
   Price: $39.00
   Billing: Recurring - Monthly
   ```
5. 保存后复制生成的 Product ID（格式：`prod_xxxxx`）
6. 重复此步骤创建其他 5 个产品

### 步骤 3: 更新代码中的 Product IDs

获得所有 Product IDs 后，更新 `src/app/pricing/page.tsx`：

```typescript
// 第 58-61 行（Basic）
productId: {
  monthly: "prod_xxxxx", // 替换为你的 Basic Monthly Product ID
  annual: "prod_yyyyy"   // 替换为你的 Basic Annual Product ID
},

// 第 94-97 行（Pro）
productId: {
  monthly: "prod_2zUJFfU5Mc9TT7mSr1OyEo", // 已有的 Product ID
  annual: "prod_zzzzz"   // 替换为你的 Pro Annual Product ID
},

// 第 130-133 行（Max）
productId: {
  monthly: "prod_aaaaa", // 替换为你的 Max Monthly Product ID
  annual: "prod_bbbbb"   // 替换为你的 Max Annual Product ID
},
```

### 步骤 4: 配置 Webhook

1. 进入 Creem Dashboard → **Developers** → **Webhooks**
2. 点击 **Add Webhook**
3. 填写信息：
   ```
   URL: https://yourdomain.com/api/payment/webhook
   Events:
     - checkout.session.completed
     - payment.succeeded
     - subscription.created
     - subscription.updated
     - subscription.cancelled
   ```
4. Webhook Secret 已在 `.env.local` 中配置

## 🧪 测试流程

### 测试支付流程：

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问定价页面：
   ```
   http://localhost:3000/pricing
   ```

3. 点击任意 "Subscribe Now" 按钮

4. 应该会：
   - 调用 `/api/payment/create-checkout`
   - 创建 Creem checkout 会话
   - 跳转到 Creem 支付页面（测试模式）

5. 在 Creem 支付页面使用测试卡号完成支付

6. 支付成功后跳转回 `/payment/success`

## 📚 Creem API 参考

### 创建 Checkout Session

**端点**：`POST https://api.creem.io/v1/checkouts`

**Headers**：
```json
{
  "Content-Type": "application/json",
  "x-api-key": "your_creem_api_key"
}
```

**Body**：
```json
{
  "product_id": "prod_xxxxx",
  "request_id": "unique_request_id",
  "units": 1,
  "customer": {
    "email": "user@example.com"
  },
  "success_url": "https://yourdomain.com/payment/success",
  "metadata": {
    "user_id": "user_123",
    "plan_type": "monthly"
  }
}
```

**Response**：
```json
{
  "id": "checkout_xxxxx",
  "checkout_url": "https://checkout.creem.io/xxxxx",
  "status": "pending"
}
```

### Webhook 事件类型

- `checkout.session.completed` - 用户完成支付
- `payment.succeeded` - 支付成功
- `subscription.created` - 订阅创建
- `subscription.updated` - 订阅更新
- `subscription.cancelled` - 订阅取消

## 🔐 环境变量

当前配置（`.env.local`）：

```bash
# Creem API Key（测试模式）
CREEM_API_KEY=creem_test_5chb7hfamNbyCHMEW4qJyF

# Webhook 签名密钥
CREEM_WEBHOOK_SECRET=whsec_2eyduTL6sHiTcyRNYXeARm
```

**生产环境切换**：
- 获取生产环境 API Key（格式：`creem_live_xxxxx`）
- 替换 `.env.local` 中的密钥

## 🎯 功能特性

### 已实现的功能：

✅ **完整定价页面**
- 三个定价方案（Basic, Pro, Max）
- 月付/年付切换
- 货币选择器（USD/GBP/EUR）
- 数量调整滑块（1x-10x）
- FAQ 部分

✅ **支付流程**
- 创建 Creem checkout 会话
- 重定向到 Creem 支付页面
- 支付成功页面

✅ **Webhook 处理**
- 验证 webhook 签名
- 处理订阅事件
- 更新 Supabase 数据库

## 📞 需要帮助？

如果遇到问题：
1. 查看 Creem 官方文档：https://docs.creem.io
2. 检查控制台错误日志
3. 验证 API Key 是否正确
4. 确认 Product IDs 已更新

## 🚀 下一步

1. ✅ 代码已完成，构建成功
2. ⏳ 在 Creem Dashboard 创建 6 个产品
3. ⏳ 更新 `pricing/page.tsx` 中的 Product IDs
4. ⏳ 测试完整支付流程
5. ⏳ 配置 Webhook URL
6. ⏳ 切换到生产环境 API Key
