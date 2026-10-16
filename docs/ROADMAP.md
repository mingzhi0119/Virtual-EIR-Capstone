# GOAT AI → Virtual EIR 路线图

日期阅读说明：以下 2026-10-08/09 内容保留当时基线；其中“本轮仅规划”“未实现”和原始勾选状态指当时工作。当前实现进度见文末 **9. October 16 current status**，不将历史规划倒写成当时已实现。

更新日期：2026-10-08。本文是 Capstone 工作计划；没有修改 GOAT AI 原仓库路线图，也没有承诺各后续阶段的固定日期。

2026-10-09 补充：R24 已完成独立 [Vercel 只读展示](https://virtual-eir-showcase.vercel.app)，供组员和老师看英文界面、已录制会话和资料快照。无聊天/API/资料写入，不连接本机模型；这不代表登录、多人使用或完整应用公网部署门禁通过。见 [部署归档](archive/2026-10-09-vercel-showcase.md)。

本轮已按实际仓库、RTX 5090 / 本地 Ollama 和运行结果定制执行路线。操作级进度以 [逐项实施清单](IMPLEMENTATION_CHECKLIST.md) 为准：R1–R8 完成，R17/R18 汇报材料与上游 PR 已交付，R20/R21 英文演示与 GOAT 外观复用已验证；R9–R13 为后续阶段，R14–R16 是多人/公网/真实敏感资料前的门禁，R19 上游 Ruff 基线仍待修。每项完成证据在 [归档](archive/2026-10-08-goat-reuse.md)；启动方式见 [LOCAL_RUN.md](LOCAL_RUN.md)。

## 1. 目标与范围

目标用户：有一个创业想法、尚未充分验证客户需求的早期创始人。

第一版价值：帮助用户把想法转换成可验证的假设和具体行动，并在下一次会话中利用之前的背景、行动及新发现继续指导。

推进顺序：本周设计与演示 → 通用 MVP 可靠运行 → Ain 反馈与定制 → 评估和学期交付。阶段之间以验收结果推进，不以文档数量推进。

## 2. GOAT 基础与复用判断

基线 main 提交：`9788ffab4a70f3dec6406778d1dc26f302b762f8`，2026-04-29，完整导入 `apps/goat`。实际检查见 [GOAT_AUDIT.md](GOAT_AUDIT.md)：聊天/历史/构建已运行；其他功能不从文档存在推断已部署。新增 `eir` 通过现有 HTTP 聊天接口复用，不扩大 GOAT workbench。

| 能力 | 仓库依据 | Virtual EIR 的处理 |
| --- | --- | --- |
| React + FastAPI、Ollama 聊天 | [运行检查](GOAT_AUDIT.md) | 保留完整原平台；EIR 新入口复用真实 GOAT SSE；补顶层 think 传参缺陷 |
| 会话历史、持久化、生成文件 | [API Reference](https://github.com/mingzhi0119/GOAT_AI/blob/9788ffab4a70f3dec6406778d1dc26f302b762f8/docs/api/API_REFERENCE.md) | 历史已实测；EIR 独立 SQLite 保存确认资料/行动，加载当前会话历史；生成文件本轮未单独验收 |
| 上传、知识检索、带引用的回答 | 同上 | 后续加载公开创业材料和获准 Ain 材料；第一版可从小范围精选资料开始 |
| 本地/学校服务器/远程运行 | [本地说明](LOCAL_RUN.md) | 已选 Windows loopback + Ollama + 现有 Gemma 26B；本轮不做学校或公网部署 |
| project_memory | [Memory 决策文档](https://github.com/mingzhi0119/GOAT_AI/blob/9788ffab4a70f3dec6406778d1dc26f302b762f8/docs/architecture/PROJECT_MEMORY_CONNECTORS_FOUNDATION_DECISION_PACKAGE.md) | 是项目输出的只读检索源；不能直接等同于自动更新创业者资料 |
| 云模型 API | [原路线图](https://github.com/mingzhi0119/GOAT_AI/blob/9788ffab4a70f3dec6406778d1dc26f302b762f8/docs/governance/ROADMAP.md) 将相关前端占位列为暂缓 | 不假定现成可用；如选云 API，明确新增适配器和用量记录工作 |

已有聊天历史解决“保存说过的话”；Virtual EIR 还需要明确“哪些假设仍未验证、约定做什么、实际完成什么”。这些应保存成可检查的项目状态。

来源冲突已核对代码：当前无登录 demo，历史 auth 配置会被拒绝；旧登录保障不可依赖。依赖审计另有 13 项 high。只用虚构案例、单用户和 loopback；公网/真实敏感资料前须新增安全整改与访问控制门禁。

## 3. 阶段 0：本周设计与最小演示

对应 [W1–W5](WEEKLY_DELIVERABLES.md)。

执行顺序：

1. 固定一个虚构早期创业场景，审阅 user journey、profile、coaching framework。
2. 跑通 GOAT 现有聊天，核对当前提示词注入和会话存储路径。
3. 加入最小 VentureProfile 与 ActionPlan，关联稳定的 venture_id。
4. 首次会话读取资料、追问并提出行动；展示和保存经确认的结果。
5. follow-up 读取同一项目的资料和上次行动，再吸收新证据并更新建议。
6. 按本周清单验收，整理 demo 和需要老师/Ain 回答的问题。

完成条件：三个草稿可审阅；两次会话能展示；实际实现的保存/读取有证据。设计演示可先展示，但运行和持久化状态必须标明。

当前结果：三个草稿已有，实际两会话及跨新会话状态、重启恢复已验证；尚待老师审阅。首次/跟进真实输出及质量局限均归档，未称专家认可。

本阶段优先文字、单项目、虚构资料、单模型。语音、多 agent、微调、复杂 connector、桌面打包及平台整体升级不进入本周核心范围。

面向美国商学院老师的产品界面、项目模板和演示对话统一英文；内部协作说明可保留中文。EIR 外观直接沿用 GOAT 的真实主题系统，不另外维护一套配色。保留历史中文记录和早期测试证据，但不用于英文现场演示。

2026-10-08 演示整理：按用户要求已将无用 EIR 实验项目及关联会话从当前库清理，并先做本地 SQLite 备份；早期 JSON 证据与 GOAT 历史不删除。当前菜单只保留一个英文项目及两次会话。例会使用 [v3 英文演讲稿](../deliverables/2026-10-08/Speaker-Script-v3.md)，PPT v2 和旧备注仍是历史快照。[本次归档](archive/2026-10-08-demo-cleanup-and-script.md)记录步骤与恢复边界。

### 3.1 本周 Week 4 新增重点：根据用户画像调整教练 Persona

2026-10-09 按 Mingzhi 补充的老师指示登记：工程师偏技术侧、艺术家偏感性认知/体验、科学家偏学术风格、商业人士偏商业分析。该四类细节来自当前用户补充，不冒充不完整会议转录的逐字原话，也不等同于 Ain 已批准。课程周次以用户确认的 **Week 4** 为准；旧材料的 Week 1/Week 2 文件名保留历史，不用于推算当前课程周次。

目标是让教练根据创业者背景调整解释方式、例子、追问和分析重点，不只是让 AI 扮演工程师或销售。英语、事实标准、证据局限和人工确认不能随 Persona 降级。职业只是初始适配参考；用户可明确选择、纠正或覆盖风格，混合/未知画像默认使用通用教练，不自动推断性格。

| 用户画像 | Persona 适配重点 | 共同底线 |
| --- | --- | --- |
| Engineer | 技术可行性、约束、结构化分析、可测实验 | 技术方案仍需验证真实客户需求 |
| Artist | 共情、体验、创作意图、叙事与感性认知 | 感受不直接当成市场证据，行动仍要可验证 |
| Scientist | 假设、研究设计、证据质量、学术表达 | 不编造研究/引用，不夸大统计意义 |
| Business professional | 客户细分、价值主张、商业模式、成本与收入假设 | 不编造财务数据、市场规模或完成工作 |

执行与验收：

- [x] 登记需求和四类适配方向；仅规划完成。
- [ ] 扩展用户画像与显式风格偏好，接入确认保存；旧资料兼容，未提供偏好时默认通用风格。
- [ ] 在 EIR 层增加 Persona 选择和提示词适配；共同教练原则优先，不需要改造 GOAT 或新增多 agent。
- [ ] 验证跨会话/重启沿用偏好、纠正后下一次调用更新、不同项目不串用；不修改历史对话和已确认事实。
- [ ] 同一虚构案例、相同模型与事实，四类画像各录制首次/跟进两次输出，形成八条真实英文回复的对照与失败记录；检查表达差异，同时保持 5 planned / 2 completed / 3 remaining 和样本局限。

详细步骤、代码入口、风险及可测试验收条件见 [Week 4 Persona 计划](../.omx/plans/2026-10-09-week4-persona.md)。总任务 R25 保持未完成；实现与验证逐项通过后打勾归档。该事项加入本周优先工作流，不新增未经确认的截止日期；现有团队每人三个想法、功能排序及 Roberto 问题清单不取消。当前 Vercel 录制版不包含此功能，本轮不改代码或重新部署。

### 3.2 Goal + Plan 与六个功能：已选定的分批发展路线

2026-10-09：Mingzhi 补充老师建议扩展 Features（包括 Plan / Goal），并明确要求 Goal 与 Plan 结合、借鉴 Codex 的先规划后执行体验，六个候选功能全部纳入。六功能的选择是本次用户决定，不写成 Ain 已逐项批准。详细代码入口、数据设计、步骤和验收见 [完整功能计划](../.omx/plans/2026-10-09-goal-plan-feature-roadmap.md)；登记见 [规划归档](archive/2026-10-09-goal-plan-feature-roadmap.md)。

核心流程：**用户画像 → 明确 Goal → 澄清约束 → Plan 草稿 → 用户确认 → 记录现实行动 → 证据复盘 → 调整计划或结束目标**。Goal 定义结果与成功标准；Plan 定义里程碑、任务、依赖和可选日期；完成看板分别展示任务进度、阻碍和证据支持程度。AI 只能建议，不能把访谈/销售自动标为已完成。计划 5 次、完成 2 次显示该任务 40% 和剩余 3 次，不代表市场需求已验证；计划修订保留版本/差异，取消任务不算完成。

| 顺序 / 建议窗口 | 功能与实施重点 | 阶段门禁 |
| --- | --- | --- |
| Week 4，10/5–10/11 | 共享数据/确认合同设计；启动 R25 Persona、R26 Goal + Plan 最小纵向流程 | 老资料兼容，进度不虚报；10/9 才新增范围，本周不是全部完成承诺 |
| 建议 Week 5，10/12–10/18 | 验收 Persona + Goal/Plan；R29 Weekly Check-in 每周复盘 | 定目标→确认计划→2/5 更新→新会话复盘→确认新版计划；重启恢复和项目隔离 |
| 建议 Week 6，10/19–10/25 | R27 Experiment Designer 实验设计；R28 Evidence Board 证据看板 | 假设、实验、任务、观察可关联；保留反例与样本局限，不自动宣布验证成功 |
| 建议 Week 7，10/26–11/1 | 依次 R31 Decision Lab 决策比较、R30 Pitch Practice 陈述演练、R32 Mentor Brief 导师简报 | 未知成本不编造，模拟不当真证据，简报准确且经用户确认导出、不自动发送 |
| 建议 Week 8，11/2–11/8 | R33 全链路评估、真实英文案例、主题/手机回归及说明归档 | 每个功能有独立验收证据；保留失败，不虚称专家认可或功能已上 Vercel |

后续窗口是内部建议排程，不是老师截止日，也不推算学期结束时间；实际工作量在首个纵向流程后校准。上一步门禁不通过就顺延，不跳过测试。Mingzhi 暂为实施负责人，其他成员未分配；保留每人三个想法、团队排序与 Roberto 具体问题的会议任务。所有新功能先本地虚构案例验证，延续 GOAT 外观与英文输出，公开展示保持冻结；本轮不更改程序、IP/许可证、权限或邀请成员。

## 4. 阶段 1：通用 MVP 可靠运行

在阶段 0 演示基础上完善，而非先扩展 GOAT 整个平台。

已落地最小版本：profile/assumptions/evidence/actions、完整会话内容、确认编辑、项目关联隔离和本地模型。本轮未做自动 SessionSummary、自动事实提取或 RAG；模型不能直接覆盖已确认事实。

| 工作 | 产出 | 完成条件 |
| --- | --- | --- |
| 项目数据与关联 | VentureProfile、Assumption、Evidence、ActionPlan、SessionSummary 的最小模型 | 同一项目可跨会话恢复；不同项目不混用资料 |
| 资料修正 | 查看/编辑界面，更新确认流程 | 用户能纠正目标客户或访谈数量，下次指导使用修正后状态 |
| 指导流程 | 资料收集、追问、证据判断、行动建议、复盘 | 能区分信息不足与证据支持；不把建议行动写成完成事实 |
| 模型连接 | 复用 Ollama；或新增选定云 API 适配器 | 真实调用可用；错误和用量有记录 |
| 小型知识集 | 公开创业框架和明确来源的材料 | 能说明建议依据，资料版本和来源可追溯 |
| 核心验证 | 记忆恢复、资料修正、项目隔离、新证据更新案例 | 记录实际输入、输出、存储状态和结果 |

完成条件：一次首次咨询与一次新会话复盘可重复运行；核心失败情况有可说明的行为；形成初版使用说明和限制。

## 5. 阶段 2：Ain 反馈与针对性定制

前置：带阶段 0/1 的真实例子及未解决问题，不能仅发送大而泛的需求清单。

- 查 Ain 公开流程，标注已确认资料和目前假设。
- 请求 EIR 审阅：intake 是否足够、追问顺序是否合理、验证行动是否实用。
- 请求具体 mentoring template、program information、匿名示例；资料使用权限先确定。
- 根据反馈调整创业阶段、提问和引导风格；添加 Ain 资源检索。
- 用多个虚构创业场景检查定制效果。

完成条件：形成 Ain 反馈记录、修改前后对照和仍未确认的边界。EIR 访谈或评估时间依对方安排，未视为已预约。

## 6. 阶段 3：评估与学期交付

评估维度：追问相关性、假设/证据区分、行动可执行性、记忆准确性、建议随新证据变化、错误信息纠正、用量与响应时间。

建议比较：相同虚构案例下，通用聊天配置与 Virtual EIR 配置分别输出什么；选定少量案例重复测试，并请 EIR 按统一量表评审（可安排时）。

拟交付：可运行 MVP、技术设计、评估结果、演示材料、部署/使用说明、已知限制。课程最终 deliverables 和 deadline 仍以老师/课程正式要求为准，会议并未确认全部学期评分要求。

完成条件：结果可复现；报告区分 GOAT 既有平台能力、团队新实现、仅设计的功能；交付格式符合课程要求。

## 7. 关键选择与依赖

| 选择/依赖 | 当前状态 | 对进度的影响 | 当前建议 |
| --- | --- | --- | --- |
| 本地/托管 Ollama 或云 API | 已选本地 Ollama + Gemma 26B，两会话已实测 | 当前不阻塞；未使用付费模型 API | 先评估当前质量；若不足，再明确云 API 适配器与老师 key 需求 |
| 创业者资料持久化 | 确认式 SQLite、版本修正与重启恢复已验证 | 已支持最小连续指导 | 保持显式确认；自动摘要/提取另立带评价的任务，不扩大只读 project_memory |
| 首轮知识来源 | 公开资料范围待整理 | 不阻塞流程草稿和虚构演示 | 精选少量公开材料；缺乏来源时明确为通用设计假设 |
| Ain-specific 数据/EIR 反馈 | 尚未取得 | 影响阶段 2，而非阶段 0 开始 | 用演示中的实际缺口请求具体材料 |
| GOAT 既有成果与团队贡献 | 需说明来源 | 影响成果归属和学期汇报 | 保留基线提交、注明复用，记录 Capstone 新增工作；确认课程允许的复用方式 |

LoRA/微调只有在 MVP 评估暴露明确能力缺口、拥有合适样例与资源后再考虑。此前 Q10 是探索问题，没有获批研发或预算承诺。

## 8. 贡献与状态记录规则

每项任务登记负责人、状态、证据位置。状态采用：草稿 → 待实现 → 已实现未验证 → 已验证 → 已展示/反馈。

实现时记录 GOAT 基线提交和每项 Capstone 增量。保留既有成果来源；对课程协议如何处理预先存在的代码，依据最终协议和老师意见确认。本轮仅整理计划，未核对最终签署文件。

## 9. October 16 current status — Week 4 foundation

Foundation implementation and recorded demonstrations were delivered on **October 16, 2026**, not October 11. Week 4 is the user-confirmed course label. The October 9 windows above remain historical proposals; no faculty deadline is inferred. See the [dated archive](archive/2026-10-16-week4-foundation.md), [English report](../deliverables/2026-10-16/Week4-Progress-Report.md) and [speaker script](../deliverables/2026-10-16/Week4-Speaker-Script.md).

| Workstream | Current delivery | Open acceptance |
| --- | --- | --- |
| P1–P3 / Persona foundation | Confirmed background/preference fields; four mappings, explicit override, unknown/mixed general fallback; compatibility, correction, session/restart and isolation evidence | Final regressions after boundary fixes |
| P4 / Persona comparison | Eight real English outputs recorded and read; observable styles, 5/2/3 follow-ups and small-sample limits, with failures retained | R25 strict quality acceptance stays open; no expert endorsement |
| S1–S3 / shared foundation | Separate versioned workspace tables in existing SQLite; typed local-model draft, edit/approve/reject, unchanged confirmed state on invalid output | Final boundary verification; full requirements retained |
| S4 / R26 | Progress states, absolute/idempotent reports, blockers, controls and report-preserving v2 demonstration implemented; backend lineage/stale-proposal fixes complete | Milestones, task owners/dates, criterion/evidence review, supported goal closure; final workflow/edge reruns and architecture acceptance |
| S5–S11 / R27–R33 | Roadmap and original acceptance gates retained | All six dedicated future features and integrated evaluation remain pending |

The recorded `Revise approved plan · retain reports` flow keeps 2/5 while approving v2 and preserving v1. Fresh `Generate AI plan` instead starts zero-count proposed work with an explicit warning and history retained. Two of five is 40% **task activity**, not business validation. Goal achievement is blocked until supported evidence review is implemented. A normal new-session follow-up using approved context is demonstrated, but the dedicated Weekly Check-in feature remains pending.

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

Persona evaluation retains quality failures: Engineer/Business initials assume the founder is the customer; Engineer follow-up uses hypothetical payment probing and overstates price-elasticity inference; Artist follow-up has `e.le.`; some outputs exceed 180 words. The initial unsupported statistical wording and earlier Persona runs are preserved; the corrected workflow reply avoids that significance claim. Eight examples do not establish reliable improvement or Ain validation.

Legacy-profile compatibility now applies the original 5,500-character limit to old content excluding the two new Persona fields, which have separate bounds. Context selection reserves policies and workspace data within the 8,000-character system-context guard, then includes full profile data if possible or explicitly marks a partial view and omissions. Full records are preserved. Focused boundary checks passed; final combined regression passed.

Recorded live migration snapshot: `var/backups/eir-pre-week4-20261016.sqlite3`, integrity `ok`, one venture / three sessions; raw legacy rows unchanged, zero live workspace records after migration. Experiments use isolated databases under `var/week4-proof/` and workflow port 62608. Final foundation repairs are verified. Live EIR remains local on 62607, GOAT on 62606 and Ollama on 11434; the Vercel recording remains frozen and older.

Next gate: complete final workflow/edge reruns and architecture re-review of the seven findings; main owner finalizes exact counts, the ten-slide PPT, detailed Persona review and quality notes; then finish remaining R26 scope before advancing each feature gate. Mingzhi remains implementation lead; teammate owners/dates are unassigned until agreed. The documentation lane makes no commits or external writes and changes no permissions, licences, GOAT source, earlier PPT or raw transcript. No cloud/public backend or expert approval is claimed.
