# 2026-10-09 Vercel 只读展示部署归档

日期按 America/New_York；用户明确要求给组员/老师看界面与已有英文案例，不生成新回复。

## 已完成步骤

- [x] 创建独立 `showcase` 静态入口，沿用 EIR CSS 和 GOAT 的真实外观/Markdown 模块；不更改本地服务。
- [x] 从 `2026-10-08-english-demo.json` 按字段白名单提取两次真实英文会话和对应确认资料。模型输出原文保留；首次展示确认后的五人计划，后续展示完成两人、剩余三人的结果。不是当前运行库的实时同步。
- [x] 禁用新建、发送和资料写入；保留会话导航、资料只读查看与主题。清楚标注 recorded / fictional / no live inference，并保留对教练质量和假设性付费问题的局限说明。
- [x] 本地八组检查通过；人工查看桌面与手机截图。没有模型/API请求、外部请求或浏览器错误。
- [x] 用户通过 Vercel 设备登录完成授权；在 Hobby scope `mingzhi0119s-projects` 新建 `virtual-eir-showcase`。仅部署生成目录，未覆盖现有 `goat` 项目。
- [x] Vercel 返回 production READY，并绑定稳定生产链接 https://virtual-eir-showcase.vercel.app 。部署 ID：`dpl_3d27KP67XkiBB2WU9f1ZhRQRqgAX`。
- [x] 未登录浏览器线上九组检查通过；生产页面 200，静态案例与本地文件完全一致；`/api/health`、`/.env.local`、`/eir/app.py`、`/apps/goat/server.py` 和 source-map 路径返回 404。
- [x] 更新 README、LOCAL_RUN、ROADMAP、逐项实施清单与英文部署说明。Git 同步以本次提交/远端核对为准，不沿用旧提交的 CI 成功。

## 上传与权限边界

只上传 `var/eir-showcase` 中的 HTML、CSS、编译外观模块、只读导航 JS、白名单虚构案例和静态配置。Vercel 构建日志记录下载 10 个部署文件，未构建 Python 服务或配置数据库。

不上传本地数据库、会议转录、系统提示词、GOAT 原始后端/前端源码文件、源码映射、凭据或完整 Git 历史。Vercel CLI 的自动 Git 连接尝试失败，没有连接本项目仓库；只使用 CLI 静态文件部署。CLI 生成的 `.env.local` 与 `.vercel` 控制文件在忽略清单中，不作为公开网站文件。浏览器仍会收到编译界面代码与展示内容，不能把前端当成保密介质。

没有邀请 GitHub collaborators、更改仓库可见性、增设许可证、调用付费模型、暴露本机端口，或创建真实创业者资料。公开链接可被转发；robots/meta/header 的 noindex 是索引提示，不是访问控制。

## 验证与复现

```powershell
node scripts/build-eir-showcase.mjs
node scripts/verify-eir-showcase.mjs
node scripts/verify-eir-showcase.mjs https://virtual-eir-showcase.vercel.app
```

机器证据在忽略目录 `var/eir-showcase-proof`：本地/线上 verification JSON、desktop/mobile PNG。验证脚本启动独立静态服务，不创建新 venture，也不修改干净演示库。

完整应用的安全整改、登录/授权、跨用户隔离、外部数据库和模型接入仍未交付；R24 不关闭 R14–R16。只有公开只读展示已上线。
