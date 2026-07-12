# Action 云端配置

云端版本使用 Supabase 负责邮箱账号、数据库、实时同步、私有文件和 Edge Functions，OpenAI 密钥只保存在服务端。

## 你需要准备

1. 一个 Supabase 项目。
2. Supabase 项目的 `Project URL` 和 `Publishable key`。这两项可以放进网页，不是私密密钥。
3. 一个 OpenAI API Key。它只能设置为 Supabase Secret，绝不能写进仓库或 `cloud-config.js`。

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
npx supabase secrets set OPENAI_API_KEY=你的密钥 OPENAI_MODEL=你选定的模型 ALLOWED_ORIGINS=http://localhost:6002,https://22duxiaoyu.github.io
npx supabase functions deploy analyze-insights
npx supabase functions deploy generate-weekly
npx supabase functions deploy ask-action
```

然后在 Supabase Dashboard 的 Authentication URL Configuration 中设置：

- Site URL：`https://22duxiaoyu.github.io/yinian/`
- Redirect URL：`http://localhost:6002/**`
- Redirect URL：`https://22duxiaoyu.github.io/yinian/**`

## 安全边界

- 数据表和文件桶均启用 RLS，每个登录用户只能读取和修改自己的数据。
- 文档桶是私有桶，文件路径以用户 ID 隔离。
- OpenAI API Key 只存在 Supabase Secrets 中。
- `service_role` key 不得放进网页、GitHub 仓库或聊天消息。
