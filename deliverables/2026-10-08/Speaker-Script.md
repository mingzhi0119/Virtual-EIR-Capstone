# Virtual EIR：第一周英文演讲稿与中文提示

适用：老师例会。8 页主讲 + 2 页备问，预计主讲约 5 分钟，另留 60–90 秒演示；总时长约 6–7 分钟，须以实际排练为准。没有核对最新会议邀请，PPT 使用成果日期而非声称正式会议日期。

英文内容也在 PPT 的 Speaker Notes 中。下面的中文提示不必对老师读出。示例均为虚构，不存在已完成真实访谈的声明。

## Slide 1: Virtual EIR

Today I will show our first Virtual EIR prototype, built on my existing GOAT AI platform. The goal is continuity: when a founder returns, the coach should use the project background and the actual results of the previous action. This is a local demonstration with a fictional venture.

中文提示：开场明确：这是第一周本地原型，重点是连续指导，不是正式上线。

## Slide 2: This week’s agreed scope

At our last discussion, we proposed a user journey, an entrepreneur profile, and a coaching framework. We also proposed an initial session and a follow-up using a mock venture. Those drafts now have a working text prototype behind them. I am bringing the flow and its limitations for feedback rather than claiming that the coaching method is already validated.

中文提示：W1–W5 来自会上提出并获认可的方向。草稿已完成，但老师尚未审阅。

## Slide 3: Existing platform and new Capstone work

GOAT already provided the general chat platform and local model connection. The Capstone work adds explicit venture state: what the founder assumes, what evidence they report, what action they planned, and what they actually completed. The new service uses GOAT’s existing chat endpoint. I keep the original platform and the new contribution clearly separate in the repository.

中文提示：清楚说明复用来源，不能把 GOAT 原平台全算本周新开发。

## Slide 4: First consultation: campus dinner delivery

Our fictional founder wants to offer campus dinner delivery. They assume that students care most about speed, but they have no interviews yet and can interview at most five people this week. The coach asks about recent dinner experiences and existing alternatives, then proposes five interviews. The founder reviews and saves the plan. The assistant cannot mark that work as completed.

中文提示：虚构案例，尚无访谈。行动是建议，必须人工确认保存。不要逐字朗读模型长回复。

## Slide 5: Follow-up: saved results change the advice

Before the follow-up, the founder saves two interview results. Both fictional students reported more concern about price than speed. I then create an entirely new session without pasting the old conversation. The coach reads the saved state, distinguishes five planned interviews from two completed interviews, and recommends exploring price and alternatives in the remaining three. It also warns that two interviews cannot establish market demand.

中文提示：5 是计划，2 是实际，3 是剩余。price 只是两个虚构样本的反馈，不能说市场验证。

### 现场演示插入点（60–90 秒）

先用已保存的虚构项目，显示 target_count=5 / completed_count=2。新建跟进会话，发送简短复盘问题，等待本地模型回复，再指认模型读取的 5/2/3 与价格反馈。不要为了省时间粘贴旧对话。

**Live-demo transition:** “I will now open the local prototype. The founder has confirmed the interview results here. This is a new session, and the coach will read the saved venture state.”

**Recorded fallback:** “The live service is not responding as expected, so I will use the recorded October 8 test. This is a recorded response, not a live one. It demonstrates the saved context and the follow-up, while the original output remains available for inspection.”

模型建议若出现引导性问法，直接说明这是待专家评审的缺点，不即兴宣称已解决。

## Slide 6: Founder confirmation and coaching flow

The coaching framework starts with clarification and evidence, followed by a small action and a return visit. The important control is founder confirmation. The founder can correct the profile and the results, while the model only proposes changes. We preserve revisions and full conversation records. Automatic summaries and automatic fact extraction remain future work.

中文提示：把指导框架和实现的确认边界讲清楚。没有自动摘要或自动资料提取。

## Slide 7: Demonstration evidence and current limits

We have verified complete local model replies, context in a new session, profile correction, and recovery after restarting the service. These checks demonstrate the flow and persistence. They do not demonstrate expert coaching quality. Some model questions still risk leading the respondent. The prototype also lacks user authentication and has unresolved dependency warnings, so I restrict it to local fictional cases.

中文提示：运行成功不等于专家质量认可。无登录，安全告警未关闭，只在本地用虚构资料。

## Slide 8: Next steps and feedback requested

The next step is to use this concrete example to refine our questions for Ain. I would value feedback on missing intake information and whether the follow-up questions lead to useful validation work. We would also like an approved mentoring template or anonymized case, if available. After that, we can assess several fictional ventures with a consistent rubric. Local testing needs no API key today.

中文提示：请老师针对实际流程反馈，再带具体缺口找 Ain。资料权限和以后云 API 都需另外确认。

## Slide 9: Appendix: implementation and validation

Use this appendix only if the audience asks about implementation. GOAT and EIR run as separate loopback services. EIR loads confirmed state and current-session history, then calls the existing GOAT SSE endpoint. Local checks passed. Remote Windows CI revealed path-comparison failures that an earlier success status masked. We reproduced and fixed those assertions, and the remote rerun is pending. The source syncs through private GitHub. Models and databases require separate installation or backup.

中文提示：备问页，不必主动读测试数字。组员本周不邀请；代码同步不等于数据库同步。

## Slide 10: Appendix: recorded demo fallback

If a live model call fails or runs slowly, explain that the next output is a recorded test from October 8, not a live response. The original Chinese input and output are in the evidence file. The English descriptions on the slides paraphrase those records. No real interviews or real founder data appear in the demonstration.

中文提示：若现场失败，明确切换“10 月 8 日记录回放”，不能冒称实时回答。

## 备问：简短回答

**What is new beyond GOAT?** “GOAT supplies the general chat platform. The new work adds founder-confirmed venture state, explicit action progress, correction, and context in a new session.”

**Does the AI remember automatically?** “The service loads saved state automatically. The founder still explicitly confirms changes. We have not implemented automatic fact extraction or summaries.”

**Do we need a paid API key?** “Local testing currently uses an existing Ollama model and GPU. No paid model API calls were made. If evaluation shows we need a cloud model, we will propose the provider, usage and spending cap first.”

**Can real users access it now?** “The prototype runs locally with fictional cases. Authentication, user authorization and dependency security work remain before shared or public use.”

**Has Ain approved this method?** “No. The flow is our proposed general framework. We would like feedback and approved materials before claiming an Ain-specific method.”

**Who did the first-week implementation?** “I am handling the initial setup this week. We will confirm team roles and repository access next week.”

**How do we treat earlier code?** “We document the original GOAT baseline separately from the new Capstone layer and will confirm the course’s expectations for reuse and contribution attribution.”

## 会前检查

- 启动 `scripts/start-local.ps1`，确认两个本地入口与 Ollama 可用。
- 打开 PPT 及演讲稿，使用一个已有虚构案例，避免现场展示测试项目列表或私人资料。
- 先按备问第 10 页准备记录回放。现场失败时明确说 recorded test。
- 在自己的 PowerPoint 中试放一遍，确认字体和版式；本轮已检查导出渲染，但不声称在 PowerPoint 应用中试放过。
- 确认实际例会时间。旧“周五 11 点”安排尚未读取当前邀请。

## 来源与状态

- meeting: https://chatgpt.com/s/cx_6ac7ea276e00819180185b7e9114a6db
- goat: https://github.com/mingzhi0119/GOAT_AI/tree/9788ffab4a70f3dec6406778d1dc26f302b762f8
- repo: https://github.com/mingzhi0119/Virtual-EIR-Capstone
- archive: docs/archive/2026-10-08-goat-reuse.md
- real: docs/archive/2026-10-08-real-demo.json
- ui: docs/archive/2026-10-08-ui-proof.json
- drafts: docs/PROTOTYPE_BRIEF.md
- weekly: docs/WEEKLY_DELIVERABLES.md
- pr: https://github.com/mingzhi0119/GOAT_AI/pull/28
- pathPr: https://github.com/mingzhi0119/GOAT_AI/pull/29

时长为排练规划，不是计时保证。中文模型输出的英文说明均为意译，不是模型生成的英文原文。技术测试仅支持本轮原型范围，不证明专家指导质量、安全就绪或全部上游 CI。