# Virtual EIR / GOAT AI Capstone 文档入口

更新日期：2026-10-08（America/New_York）。

只读展示部署更新：2026-10-09。[在线英文展示](https://virtual-eir-showcase.vercel.app)可匿名查看首次咨询、后续咨询与资料快照，不生成新回复、不保存编辑、不连接本机 Ollama。案例均为虚构，页面明确标注为 10 月 8 日录制；不需要作者电脑在线。见 [展示版说明](showcase/README.md)和 [部署归档](docs/archive/2026-10-09-vercel-showcase.md)。这不是完整应用的公网发布，下面的本地运行与安全边界不变。

团队仓库：[mingzhi0119/Virtual-EIR-Capstone](https://github.com/mingzhi0119/Virtual-EIR-Capstone)（Private）。新设备同步和组员工作流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，组员邀请状态见 [GitHub 设置说明](docs/GITHUB_SETUP.md)。

项目方向：复用已有 GOAT AI 聊天平台，做一个能够记住创业项目背景、追问关键假设、跟进验证行动的 Virtual Entrepreneur-in-Residence（Virtual EIR）。先用通用创业框架和虚构案例形成演示，再让 Ain Center / EIR 提供具体反馈。

## 阅读顺序

| 文档 | 用途 |
| --- | --- |
| [本周交付与会议承诺](docs/WEEKLY_DELIVERABLES.md) | 核对老师指示、会上实际提出的内容、本周交付清单及验收标准 |
| [GOAT AI → Virtual EIR 路线图](docs/ROADMAP.md) | 明确复用范围、开发顺序、阶段完成条件和暂缓事项 |
| [逐项实施清单](docs/IMPLEMENTATION_CHECKLIST.md) | 复用、上游修复与汇报材料的打勾状态、后续步骤及验收条件 |
| [第一周 PPT 与演讲稿](deliverables/2026-10-08/README.md) | 8 页英文主讲 + 2 页备问、逐页讲稿、现场演示与备用方案 |
| [本地启动与换机](docs/LOCAL_RUN.md) | 一键启动、两会话演示、停止、数据备份与运行限制 |
| [GOAT 完成情况检查](docs/GOAT_AUDIT.md) | 实测能力、待补差距、兼容修复和安全阻断 |
| [本轮归档](docs/archive/2026-10-08-goat-reuse.md) | 每步执行记录、真实模型和自动测试证据 |
| [第一版原型设计与演示稿](docs/PROTOTYPE_BRIEF.md) | 提供用户流程、资料模板、指导框架、两次会话脚本及 API 申请邮件草稿 |
| [GitHub 设置与组员访问](docs/GITHUB_SETUP.md) | 仓库信息、邀请方式与同步验证 |

## 当前状态

- 已完成：本轮规划文档和原型设计草稿。
- 已完成：可编辑英文 PPT、Speaker Notes、英文讲稿与中文提示；成果日期为 10 月 8 日，会议安排未再次核对。
- 已完成：私有 GitHub 仓库初始化、文档推送、main 跟踪及独立目录 clone 验证。组员邀请按安排暂缓。
- 已完成：完整 GOAT 源码 subtree 导入、本地部署、Gemma 26B 真实两会话；确认式创业资料、5/2 访谈数量区分、重启恢复、修正与项目关联隔离。
- 已完成：面向老师的英文输入模板、英文默认回复策略与英文两会话真实演示；Virtual EIR 直接复用 GOAT 主题、字体和图标，改为聊天优先布局、侧栏会话和档案弹窗。历史中文记录保留，不冒充已翻译。
- 本地已验证：EIR 24 个确定性测试、21 组 headless UI 检查；GOAT 后端/契约 540 项通过（另有 8 个跳过）。基线前端 217 项通过；远程 fail-fast [run 37839067814](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37839067814) 也已通过并核对日志。此前状态绿色掩盖失败的记录仍保留；本次英文/UI 增量的远程结果另记，不沿用基线成功。
- 尚未完成：老师/EIR 审阅、Ain-specific 知识、多案例评价、依赖安全升级、登录/多人授权或完整应用公网部署。已发布的只读静态展示不开放这些能力；当前只用虚构数据。
- 本轮模型/API：本机 Ollama + 已有 `gemma4:26b`；未调用付费模型 API，不需要老师 key。以后需要云 API 再提出具体申请。
- 第一周启动负责人：Mingzhi。组员邀请和后续分工最早下周再讨论；文档中的角色是工作类别，不代表成员已经接受任务。

写好示例对话不等于系统实际运行成功；写好数据模板不等于已实现存储。交付状态和验收证据统一记录在 [本周清单](docs/WEEKLY_DELIVERABLES.md)。

## 本机直接使用

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

打开 [Virtual EIR](http://127.0.0.1:62607)；完整原平台在 [GOAT AI](http://127.0.0.1:62606)。若浏览器仍显示旧页面，刷新一次。老师演示请选择英文虚构项目，或点 `New fictional venture` 从头开始。新设备首次运行加 `-Install`，前置环境和数据恢复见 [本地说明](docs/LOCAL_RUN.md)。无登录，仅 loopback 本地使用。

## 时间口径

“本周”按当前对话理解为 2026-10-05 至 2026-10-11。此前记忆中的例会时间为周五 11:00；若该安排仍有效，下一次为 2026-10-09 11:00（America/New_York）。这只是计划锚点，未核对当前邀请；分享记录本身没有显示会议日期，不能据此认定正式截止日期。

## 依据

1. [上次对话及用户粘贴的会议转录](https://chatgpt.com/s/cx_6ac7ea276e00819180185b7e9114a6db)：区分老师原话、Mingzhi 实际发言和助手拟稿。
2. [GOAT AI 仓库](https://github.com/mingzhi0119/GOAT_AI)：本轮读取的 main 提交为 `9788ffab4a70f3dec6406778d1dc26f302b762f8`，提交时间 2026-04-29。仓库文件是设计和代码依据，不能证明现在部署仍可用。
3. 之前 Capstone 邮件/协议分析的记忆：用于例会与已有成果背景；本轮没有重新读取邮箱或最终签署协议，可能已更新。

GOAT 源码保存在 `apps/goat`，Capstone 新增层在 `eir`；基线 SHA 与新增改动分别留档。本项目 subtree 已补 `think` 传参及路径断言修复，上游分别提交 [PR #28](https://github.com/mingzhi0119/GOAT_AI/pull/28)、[PR #29](https://github.com/mingzhi0119/GOAT_AI/pull/29)，尚未合并，线上部署未变。代码经 GitHub 同步，数据库、模型和依赖不会自动同步。
