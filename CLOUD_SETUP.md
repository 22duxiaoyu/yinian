# Action 云端配置

云端版本使用 Supabase 负责邮箱账号、数据库、实时同步、私有文件和 Edge Functions，DeepSeek 密钥只保存在服务端。

## 你需要准备

1. 一个 Supabase 项目。当前项目已经创建并连接，项目 Ref 为 `uukyfcablxsuhrxgmfov`。
2. Supabase 项目的 `Project URL` 和 `Publishable key`。这两项可以放进网页，不是私密密钥。
3. 一个 DeepSeek API Key。它只能设置为 Supabase Secret，绝不能写进仓库或 `cloud-config.js`。
4. 一个生产可用的 SMTP 服务。Supabase 免费项目的默认邮件服务不允许修改确认邮件模板，也不适合向公开用户发送注册邮件。

## 前端连接

把 Supabase Dashboard 中的两个公开参数填入 `cloud-config.js`：

```js
window.ACTION_CLOUD_CONFIG = {
    supabaseUrl: "https://你的项目编号.supabase.co",
    publishableKey: "你的 Publishable key",
};
```

## 初始化后端

在项目目录运行：

```bash
npx supabase login
npx supabase link --project-ref 你的项目编号
npx supabase db push
npx supabase secrets set DEEPSEEK_API_KEY=你的密钥 DEEPSEEK_MODEL=deepseek-v4-flash ALLOWED_ORIGINS=http://localhost:6002,https://22duxiaoyu.github.io
npx supabase functions deploy analyze-insights
npx supabase functions deploy generate-weekly
npx supabase functions deploy ask-action
npx supabase functions deploy admin-analytics
```

然后在 Supabase Dashboard 的 Authentication URL Configuration 中设置：

- Site URL：`https://22duxiaoyu.github.io/yinian/`
- Redirect URL：`http://localhost:6002/**`
- Redirect URL：`https://22duxiaoyu.github.io/yinian/**`

## 六位邮箱验证码

前端使用 `verifyOtp` 在当前注册页验证六位数字。验证码长度、有效期和邮件模板保存在 `supabase/config.toml` 与 `supabase/templates/confirmation.html`。

先在 Supabase Dashboard 的 Authentication SMTP Settings 中配置自定义 SMTP，再运行：

```bash
npx supabase config push --project-ref uukyfcablxsuhrxgmfov
```

在自定义 SMTP 完成前，Supabase 会继续发送默认确认链接。注册页保留了兼容提示，用户点击邮件中的确认按钮后仍可完成登录。

## 管理员数据中心

管理入口为 `admin.html`。页面只读取 `admin-analytics` 返回的聚合数据和脱敏账号，不读取用户灵感正文。

管理员账号以邮箱 SHA-256 哈希配置在 Supabase Secret 中：

```bash
npx supabase secrets set ADMIN_EMAIL_HASHES=邮箱哈希 --project-ref uukyfcablxsuhrxgmfov
npx supabase functions deploy admin-analytics --project-ref uukyfcablxsuhrxgmfov
```

没有登录、登录账号不在管理员名单内、或直接调用函数时都会被服务端拒绝。浏览器前端不包含 `service_role` key。

## 安全边界

- 数据表和文件桶均启用 RLS，每个登录用户只能读取和修改自己的数据。
- 文档桶是私有桶，文件路径以用户 ID 隔离。
- DeepSeek API Key 只存在 Supabase Secrets 中。
- `service_role` key 不得放进网页、GitHub 仓库或聊天消息。
- 管理员权限在 Edge Function 服务端校验，不能通过修改前端代码绕过。
