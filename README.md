# 项目设计师内部体验

网址：https://www.actionmind.cn/

首页先展示暗色的入口升级介绍页，页尾点击“进入原型体验”后，在当前窗口进入 https://www.actionmind.cn/prototype/。原型页面与 AI 接口保持现有版本，浏览器记录仍保存在同一域名下。

无需注册账号；打开网址先输入内部体验密码，验证后可进入介绍页和原型。对话、项目和原始附件保存在各自浏览器。当前原型 06 的五部分生成流程；AI 后台为 https://actionmind-project-api.netlify.app，模型密钥和体验密码只保存在后台。

2026-10-11 更新：同步当前原型（designerVersion 21）和极简点线生成动效。

2026-10-12 更新：增加产品介绍首页；原型移至 `/prototype/`，原型文件原样保留。文件解析、PDF worker 和图示库继续保留根路径。

密码入口由相邻 `access-gate/client.js` 注入首页、404 页面和原型页面，后续 `course-project-online/build-pages.mjs` 会自动保留这一层。后台同步校验会话，没有密码不能调用 AI；这不是对 GitHub Pages 静态源文件的保密措施。
