# 一念

一念是一个本地优先的碎片日记与灵感收集工具。它借鉴 Memos 的快速记录思路，但这个轻量版不依赖后端，数据存储在浏览器 LocalStorage 中，适合快速验证个人项目方向。

## 功能

- 新建灵感、日记、复盘、待办
- 本地账户登录，按用户隔离记录
- 时间线浏览
- 搜索标题、正文和标签
- 按类型、今天、归档筛选
- 标签云
- 置顶、归档、删除
- JSON 导入和导出

## 本地运行

```bash
python3 -m http.server 6002
```

然后打开 `http://localhost:6002`。

## 第一阶段上线

这个版本是纯静态网站，可以直接部署到 GitHub Pages。

推荐仓库名：`yinian`

上线步骤：

1. 在 GitHub 新建一个空仓库，仓库名填 `yinian`。
2. 把本目录作为仓库根目录推送到 GitHub。
3. 进入仓库的 `Settings` -> `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待部署完成，访问 `https://你的用户名.github.io/yinian/`。

当前版本的数据保存在浏览器 LocalStorage 中。换设备、换浏览器或清理浏览器数据后，需要通过 JSON 导出/导入迁移。

## 账号与数据

当前版本是本地账户：用户名和访问码只保存在当前浏览器，用来区分不同记录空间。它能解决刷新、同设备回访和多人共用浏览器时的数据隔离，但不等于云端同步。换设备、换浏览器或清除浏览器数据后，仍需要通过 JSON 导出文件恢复。

真正上线时建议接 Supabase、Firebase、PocketBase 或自建后端，把登录、数据库和备份做成云端能力。

## 开源说明

项目方向参考了 MIT 开源项目 Memos：

- Upstream: https://github.com/usememos/memos
- License: MIT

本目录下的轻量实现为独立静态版本；完整上游源码保存在同级目录 `yinian-memos`。
