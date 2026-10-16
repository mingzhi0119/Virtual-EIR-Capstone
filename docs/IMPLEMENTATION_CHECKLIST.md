# GOAT AI 复用实施清单

历史与当前状态：下方 2026-10-08/09 的描述与原始勾选保留当时事实；最新 Week 4 实施状态见文末 **October 16 current status**。历史“仅文档”不代表当前仍未实现；本次文档协作不执行提交或外部写入。

负责人：Mingzhi；开始日期：2026-10-08。每一步通过验收后打勾，将证据记入 [实施归档](archive/2026-10-08-goat-reuse.md)，随后提交 Git。未运行的功能不标为完成。

## 本轮执行顺序

- [x] R1：核对 GOAT 来源并导入本仓库。验收：`apps/goat` 为 Git subtree，保留上游 SHA，非临时目录或另一个隐藏仓库。
- [x] R2：检查本机运行条件。验收：Python 3.14、Node 24、Ollama HTTP 和 RTX 5090 可读；已有模型，无需下载。
- [x] R3：运行 GOAT 基线。验收：安装依赖、构建前端、健康/就绪探针通过，真实模型回复和历史保存可读。
- [x] R4：完成复用差距报告与架构决策。验收：区分已有能力、实测能力和未覆盖能力；明确创业资料不依赖只读 project_memory。
- [x] R5：实现最小创业资料与行动记录。验收：稳定 venture_id、SQLite 持久化、用户确认/修正、不同项目隔离；计划 5 次与完成 2 次分开存储。
- [x] R6：接通创业教练文字界面。验收：复用 GOAT 模型聊天路径，读取项目状态，首次和新会话均可调用；不要求粘贴旧对话。
- [x] R7：验证两次真实模型会话和失败边界。验收：首次行动、两次访谈的新证据、建议变化、重启恢复、项目隔离、修正、模型不可用可解释；保存虚构测试证据。
- [x] R8：归档部署说明并同步 GitHub。说明、源码同步与独立 clone 已完成；fail-fast run 37839067814 通过，日志确认 18 / 540 / 217 项测试通过。首轮绿色掩盖路径断言失败的更正记录保留；新增英文/UI 提交另跑 CI。

## 后续阶段，不抢占本周演示

- [ ] R9：带真实演示给老师确认 W1–W5；核对复用成果标注与会议安排。
- [ ] R10：以具体缺口请求 Ain 流程/材料与 EIR 反馈，确认资料使用权限。
- [ ] R11：增加经过确认的知识来源与多案例评估，对比通用聊天和 Virtual EIR。
- [ ] R12：根据评估决定云 API 或部署需求；需要时向老师申请 key，不使用学生个人付费额度。
- [ ] R13：下周由 Mingzhi 确认组员、权限、分工后再邀请；目前不邀请任何人。

## 多人 / 公网 / 真实敏感资料前的门禁

- [ ] R14：整改依赖审计告警，并证明升级不破坏 GOAT 前后端；当前 26 项、13 high 未关闭。
- [ ] R15：实现登录、所有数据入口的用户授权与跨用户隔离；项目 UUID 不是访问控制。
- [ ] R16：在拟部署环境验证端到端流程、备份恢复与数据迁移；完成安全复核后才评估对外部署。

## 本轮补充交付

- [x] R17：制作老师例会 PPT 与演讲稿。验收：10 页可编辑英文 PPT（8 页主讲、2 页备问）、逐页备注/来源、英文讲稿与中文提示、现场演示和明确标注的录制备用方案；重新导入并渲染检查全部页面。原生 PowerPoint 放映与计时排练留给实际例会准备。
- [x] R18：提交已证实的 GOAT 上游缺陷 PR。验收：PR #28 修复 Ollama thinking 字段与文档，PR #29 修复三项 Windows 路径断言；各有回归证据，均未合并。完成的是修复与提交，不是 CI 全绿或发布。
- [ ] R19：修复上游 Ruff 版本漂移的 CI 基线；与 R14 的依赖安全升级分别处理。保留门禁，不通过禁用检查制造绿色状态。
- [x] R20：把老师演示改为英文。验收：英文虚构资料、首次/复盘问题、界面文案；现有部署提示配置覆盖三个 GOAT 主题；真实两会话回复英文；另测中文输入/冲突偏好并记录语言策略的概率边界。旧中文资料不删除或静默翻译。
- [x] R21：统一 Virtual EIR 与 GOAT 外观。验收：直接复用真实主题模块、字体及 Lucide 图标；聊天布局、侧栏和档案弹窗；六组主题/明暗配置、窄屏/低高度、确认保存与草稿保护；24 项确定性测试、21 组 UI 检查和实机视觉检查归档。
- [x] R22：按本次要求清理无用实验项目。验收：47 个明确项目、60 个关联会话和 98 版测试档案移出当前库；SQLite 一致性备份可供恢复；保留一个英文项目、两次会话及四版档案，实机菜单确认。详见 [清理归档](archive/2026-10-08-demo-cleanup-and-script.md)。
- [x] R23：升级英文演讲稿。验收：v3 对应原 10 页，补细节、五个有证据的亮点、现场英文台词、11 组备问和约五分钟短版；标明 PPT 旧备注未同步。没有将质量计划写成已实现。
- [x] R24：发布独立 Vercel 只读英文展示。验收：仅上传白名单静态文件，保留首次/跟进真实记录和 5/0、5/2 资料快照，禁用写入和推理，沿用 GOAT 主题；本地八组、匿名线上九组检查通过，桌面/手机截图已检查，私有/API/源码映射路径返回 404。原 GOAT 站点和仓库权限不变；不是完整应用上线。见 [部署归档](archive/2026-10-09-vercel-showcase.md)。

## Week 4 新增工作（2026-10-09）

- [ ] R25：根据创业者用户画像适配教练 Persona。老师指示由 Mingzhi 在当前对话补充：Engineer 技术侧、Artist 感性/体验、Scientist 学术风格、Business professional 商业分析。实现需支持用户确认/覆盖偏好、旧资料兼容、跨会话/重启持续、修正与项目隔离；四类画像同一案例各首次/跟进两次，共八条真实英文回复，验证风格差异但事实与证据标准不变。详见 [Week 4 计划](../.omx/plans/2026-10-09-week4-persona.md)。
- [x] R25 的需求登记与路线图补充已归档；不代表功能完成。各实现/验证步骤仍未打勾，记录见 [本次规划归档](archive/2026-10-09-week4-persona-roadmap.md)。

## Goal + Plan 与六功能（2026-10-09，已选定，分批实施）

详细顺序 S1–S11 和各项验收见 [完整功能计划](../.omx/plans/2026-10-09-goal-plan-feature-roadmap.md)。保留 R25，不把新功能全部视为本周截止任务。建议依赖顺序：共享合同 → Persona → Goal/Plan → 复盘 → 实验 → 证据 → 决策 → Pitch → 简报 → 集成验收。

- [x] 范围登记与阶段路线完成，见 [本次规划归档](archive/2026-10-09-goal-plan-feature-roadmap.md)；仅文档，不代表实现。
- [ ] R26：Goal + Plan 统一工作区。验收：目标/成功标准、计划草稿确认、里程碑/任务/依赖、进度/阻碍、用户控制与版本化重规划；2/5=40% 仅指该任务；证据不足不能称目标实现；确认、修正、幂等、版本冲突、旧资料兼容、重启/隔离测试通过。
- [ ] R27：Experiment Designer。验收：目标/假设/任务关联的实验卡，方法/对象/中性问题/指标/判断标准；保持五次访谈容量，用户接受才关联，不虚报已执行。
- [ ] R28：Evidence Board。验收：证据可关联、修正，支持/反对/不明确可见，来源/样本/局限保留；模拟材料不进入真实证据，不自动宣称市场验证。
- [ ] R29：Weekly Check-in。验收：新会话基于已确认目标/计划复盘，准确显示 5/2/3，询问阻碍并建议优先事项/新版计划；冲突需确认，不自动改状态或发送提醒。
- [ ] R30：Pitch Practice。验收：英文模拟客户/投资人演练、保存修改稿与明确量表反馈；模拟反应不得变成真实访谈/销售/融资或证据，不伪造融资成功率。
- [ ] R31：Decision Lab。验收：比较两至三个选项，明确已知输入、假设、风险与下一项验证；不编造财务/市场数字，不自动承诺或改计划。
- [ ] R32：Mentor Brief。验收：一页英文预览与 Markdown/打印导出，准确摘要目标/进度/证据/阻碍和三个问题，导出经用户确认；不含内部提示/私有路径/GOAT 源码，不自动发送。
- [ ] R33：集成评估与逐项归档。验收：确定性回归、隔离库桌面/手机主题检查、三个虚构案例全流程、Persona 英文对照；每项保存真实结果和失败边界后打勾，公开展示更新另行确认。

## 实施边界

本地单用户、虚构案例、文字优先。服务只绑定 `127.0.0.1`，不把无登录 demo 暴露到局域网或互联网。代码通过 GitHub 同步；数据库、模型、依赖和日志不进 Git，换机需另行安全迁移数据。自动提取的资料不得未经用户确认覆盖事实；先实现显式编辑与保存。

R24 的静态展示是独立的、无后台读写能力的公开文件集；不改变上述本地服务边界，也不关闭 R14–R16。

## October 16 current status — foundation delivery and open gates

Completed to the foundation demo stage on October 16, 2026 (America/New_York), not October 11. Original requirements above are retained. Evidence and caveats: [foundation archive](archive/2026-10-16-week4-foundation.md), [report](../deliverables/2026-10-16/Week4-Progress-Report.md), [script](../deliverables/2026-10-16/Week4-Speaker-Script.md).

- [x] P1 — Confirmed optional founder background/preference, explicit save/revisions and old-profile defaults. Legacy content retains its 5,500-character limit excluding the new, separately bounded Persona fields.
- [x] P2 — Four mapped styles, explicit preference override and general fallback for unknown/mixed background; shared policy and untrusted-input handling.
- [x] P3 — Initial evidence for continuity, correction, reopening persisted state and venture isolation without rewriting historical turns. Final foundation regression passed.
- [x] P4 — Eight real English outputs recorded and read, with style/factual/action/evidence/language review and disclosed failures; main owner archives the detailed table. This completes evaluation recording, not perfect response-quality acceptance.
- [ ] R25 strict acceptance — Implemented and exploratorily evaluated; quality failures and final review still open. Engineer/Business customer-perspective confusion, Engineer hypothetical payment / overstrong elasticity wording, Artist typo and word-limit overruns are retained.
- [x] S1 foundation — Strict versioned workspace contracts and separate tables in existing SQLite; backup/compatibility/isolation evidence. Legacy actions are not silently migrated into workspace tasks.
- [x] S2 foundation — Persona implementation and eight-output comparison delivered; R25 final quality gate remains open.
- [x] S3 foundation — Real GOAT/Ollama JSON draft, validation, edit/approve/reject and confirmed-state boundary demonstrated. Full milestone/owner/date requirements remain in R26.
- [ ] S4 / full R26 — Five states, absolute/idempotent progress, corrections, blockers, pause/resume/cancel and report-preserving v2 are implemented. Backend task-lineage/diff and stale retained-report proposal fixes are complete; final workflow/edge reruns passed and foundation architecture approval was obtained. Milestones, task owners/dates, criterion/evidence review and supported goal closure remain pending. No automatic achievement.
- [ ] S5 / R29 — Weekly Check-in feature pending; ordinary new-session context with 5/2/3 demonstrated only.
- [ ] S6 / R27 — Experiment Designer pending.
- [ ] S7 / R28 — Evidence Board pending.
- [ ] S8 / R31 — Decision Lab pending.
- [ ] S9 / R30 — Pitch Practice pending.
- [ ] S10 / R32 — Mentor Brief pending.
- [ ] S11 / R33 — Full integration/evaluation and final independent acceptance pending.
Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

The UI-tested `Revise approved plan · retain reports` creates a draft carrying 2/5; fresh `Generate AI plan` starts proposed tasks at zero with a warning and earlier history retained. 40% means task activity only, never market validation. Model drafts do not confirm facts; invalid output leaves confirmed state unchanged. Full goal achievement remains blocked pending future evidence review.

Legacy-row comparison confirmed one venture and three sessions unchanged after migration, with zero live workspace records; backup integrity was `ok`. This is the recorded migration snapshot. Raw proof and test databases live under ignored `var/week4-proof/`; tests use workflow port 62608, not live 62607. Context hardening explicitly selects a partial profile when needed while preserving policies/full storage; final combined boundary verification passed.

Mingzhi remains implementation lead. Teammate owners and deadlines are unassigned until agreed. Main owner owns final PPT/quality notes. Frozen Vercel, GOAT source/licensing, invitations and historical PPT/transcript are unchanged by this lane; no new CI, cloud deployment or Ain-approval claim.
