# Webhook 调试指南 - 没有收到 Webhook 事件

## 当前状态

✅ 数据库连接正常（测试端点成功）
✅ Service Role Key 配置正确
✅ 代码逻辑正确
❌ Webhook 没有被调用（终端没有日志）

## 问题诊断

### 第 1 步：检查 Creem Webhook 配置

1. 登录 https://creem.io/dashboard
2. 进入 **Developers** → **Webhooks**

**检查清单：**

#### A. Webhook URL 是否正确？

应该是：
```
https://YOUR_NGROK_URL.ngrok.io/api/payment/webhook
```

**常见错误：**
- ❌ `http://localhost:3000/api/payment/webhook` （本地 URL，Creem 无法访问）
- ❌ `https://YOUR_NGROK_URL.ngrok.io/api/webhook` （路径错误）
- ❌ `https://YOUR_NGROK_URL.ngrok.io/payment/webhook` （缺少 /api）

#### B. 是否订阅了正确的事件？

必须勾选以下事件：
- ✅ `checkout.session.completed`
- ✅ `payment.succeeded`（可选，但推荐）
- ✅ `subscription.created`（可选）

如果没有勾选 `checkout.session.completed`，Creem 不会发送 webhook！

#### C. Webhook 状态是否启用？

确保 Webhook 的状态是 **Enabled**（启用），不是 Disabled（禁用）

---

### 第 2 步：检查 ngrok 是否正在运行

在终端运行 `ngrok http 3000` 应该看到：

```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
Web Interface                 http://127.0.0.1:4040

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**检查：**
- `Session Status` 是否为 `online`
- `Forwarding` 的 HTTPS URL 是否与 Creem Webhook URL 匹配

**ngrok 监控界面（重要！）：**

打开浏览器访问：http://127.0.0.1:4040

这个界面会显示所有通过 ngrok 的 HTTP 请求，包括 Creem 发送的 webhook。

**如果支付完成后，在 ngrok 界面看不到任何请求**：
- 说明 Creem 根本没有发送 webhook
- 检查 Creem Dashboard 中的 Webhook 配置

**如果在 ngrok 界面看到请求，但开发服务器没有日志**：
- 说明请求被拦截或路由错误
- 检查请求的路径是否正确（应该是 `/api/payment/webhook`）

---

### 第 3 步：查看 Creem Webhook 日志

1. 在 Creem Dashboard 中，进入 **Developers** → **Webhooks**
2. 点击你配置的 Webhook
3. 查看 **Recent Deliveries** 或 **Logs** 部分

**应该能看到：**
- Webhook 发送的时间戳
- 请求的 URL
- 响应状态码（200 = 成功，4xx/5xx = 错误）
- 响应内容

**常见情况：**

#### 情况 A：没有任何发送记录
→ Creem 没有触发 webhook
→ 检查是否订阅了 `checkout.session.completed` 事件

#### 情况 B：显示 4xx 错误（如 404, 400）
→ Webhook URL 配置错误
→ 检查 URL 路径是否正确

#### 情况 C：显示 5xx 错误（如 500, 502）
→ 你的服务器出错了
→ 查看开发服务器的错误日志

#### 情况 D：显示 200 成功
→ Webhook 已送达
→ 但数据可能没有保存，检查数据结构

---

### 第 4 步：测试 Webhook（手动触发）

Creem 通常提供 Webhook 测试功能：

1. 在 Creem Dashboard 的 Webhook 配置页面
2. 找到 **Test** 或 **Send Test Event** 按钮
3. 选择 `checkout.session.completed` 事件
4. 点击发送

**如果看到开发服务器打印日志**：
- ✅ Webhook 配置正确
- 问题可能在于真实支付时的数据结构

**如果没有看到日志**：
- 检查 ngrok 是否在运行
- 检查 Webhook URL 是否正确

---

### 第 5 步：检查支付流程中的 Webhook 配置

有些支付系统需要在创建 checkout 时指定 webhook URL。检查我们的代码：

```typescript
// src/app/api/payment/create-checkout/route.ts
const requestBody = {
  product_id: productId,
  request_id: requestId,
  units: units,
  customer: { email: user.email },
  success_url: `${req.headers.get('origin')}/payment/success`,
  metadata: {
    user_id: user.id,
    plan_type: planType,
  },
  // 可能需要添加 webhook_url?
}
```

**查看 Creem 文档：**
https://docs.creem.io/api-reference/endpoint/create-checkout

如果文档中有 `webhook_url` 参数，我们需要添加它。

---

### 第 6 步：使用增强的日志调试

我已经添加了详细的 webhook 日志。现在重启开发服务器：

```bash
# 停止服务器 (Ctrl+C)
npm run dev
```

再次完成支付，查看终端。

**如果 Webhook 被调用，你会看到：**

```
========== WEBHOOK RECEIVED ==========
[Webhook] Timestamp: 2025-01-04T...
[Webhook] Headers: { ... }
[Webhook] Raw body: { ... }
[Webhook] Signature: whsec_...
[Webhook] Webhook secret configured: whsec_2eyd...
[Webhook] Event parsed: {
  "type": "checkout.session.completed",
  "data": { ... }
}
[Webhook] Event type: checkout.session.completed
[Webhook] Handling checkout.session.completed
[Webhook] Processing checkout.session.completed: { ... }
[Webhook] Extracted data: { userId: '...', ... }
...
========== WEBHOOK COMPLETED ==========
```

**如果完全没有这些日志**：
→ Webhook 根本没有被调用
→ 检查 Creem Dashboard 和 ngrok

---

## 快速检查清单

### Creem Dashboard
- [ ] Webhook URL = `https://YOUR_NGROK_URL.ngrok.io/api/payment/webhook`
- [ ] 勾选了 `checkout.session.completed` 事件
- [ ] Webhook 状态 = Enabled
- [ ] 保存了配置

### ngrok
- [ ] ngrok 正在运行（`ngrok http 3000`）
- [ ] 访问 http://127.0.0.1:4040 能看到监控界面
- [ ] ngrok URL 与 Creem Webhook URL 匹配

### 开发服务器
- [ ] `npm run dev` 正在运行
- [ ] 没有编译错误
- [ ] 监听在 http://localhost:3000

### 环境变量
- [ ] `CREEM_WEBHOOK_SECRET` 已配置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已配置

---

## 解决方案总结

### 如果 ngrok 界面没有请求
→ Creem 没有发送 webhook
→ 检查 Creem Webhook 配置，确保订阅了正确的事件

### 如果 ngrok 有请求，但服务器没日志
→ 路由问题
→ 检查 URL 路径是否为 `/api/payment/webhook`

### 如果服务器有 Webhook 日志，但数据没保存
→ 数据结构或逻辑问题
→ 查看详细日志中的 `event.data` 结构

---

## 下一步

1. **检查 Creem Dashboard** → 确认 Webhook 配置
2. **检查 ngrok 监控界面** → http://127.0.0.1:4040
3. **重启开发服务器** → 查看增强的日志
4. **完成一次测试支付** → 观察日志输出

完成后，把你看到的情况告诉我：
- Creem Dashboard 中 Webhook 的配置截图
- ngrok 界面是否有请求
- 开发服务器是否有日志输出
- 如果有日志，完整的日志内容是什么
