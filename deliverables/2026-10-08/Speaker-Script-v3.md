# Virtual EIR：英文演讲稿 v3 与现场操作提示

更新：2026-10-08。面向美国商学院老师。英文段落可以直接讲，中文只供自己操作和排练。

本稿沿用现有 PPT v2 的 8 页主讲、2 页备问顺序，但加入新版英文原型的细节。**PPT 文件和其中的旧 Speaker Notes 未同步更新**。放映时以本稿为准，尤其不要沿用旧备注中的“中文输出英文意译”或“远程 CI pending”。本次模型记录本身就是英文。

排练规划：主讲加演示约 8–10 分钟，不含问答。只读每页“主讲”，不要把可补充段落和备问全部读完。第 5 页留约 90–120 秒操作及等待模型。实际时间须自己计时，模型延迟也会变化。末尾提供约 5 分钟的短版。

## Slide 1: Virtual EIR

### 主讲

Today I will show our first Virtual EIR prototype. EIR stands for Entrepreneur in Residence. The prototype gives an early-stage founder a place to discuss an idea, choose a small validation task, and return with what they learned.

The question we are testing is simple: when the founder returns, can the assistant use the actual progress of the venture to give a relevant next step?

I built this version on my existing GOAT AI platform. Today’s example is fictional, and the model runs locally. We are presenting a working flow for feedback. We have not yet established that its advice meets a human EIR’s standard.

中文提示：先讲“创业者回来后，指导能否接上实际进展”。不要开场介绍 GPU、测试数量或复杂架构。

### 可补充

A founder may return before completing the original task. That partial progress is exactly what this example tests.

## Slide 2: This week’s agreed scope

### 主讲

At our last discussion, I proposed a user journey, an entrepreneur profile, and a coaching framework. We also discussed a mock venture with an initial consultation and a follow-up. You highlighted persistence and continuity, so I made that the focus of the prototype.

The user journey now covers entering the idea, receiving questions, confirming an action, recording results, and returning for another session. The profile separates the venture background from assumptions and reported evidence. The coaching framework asks the founder to clarify the problem and take a manageable step before drawing a larger conclusion.

These are our initial drafts. The working prototype lets us examine how they behave together and identify specific questions for Ain.

中文提示：对应 W1–W5。说 proposed / discussed，不把会上提议包装成已签署需求。草稿已经写出，但尚未获老师或 Ain 审阅认可。

## Slide 3: Existing platform and new Capstone work

### 主讲

GOAT already provides the general chat application and the connection to a local model. Reusing it lets this week’s work focus on the founder’s experience.

The new Capstone layer stores a venture profile with a stable project ID. It records assumptions, reported evidence, and an action’s planned and completed counts. Each new session loads the confirmed profile for that venture. The founder can correct the profile, and the application keeps its previous revisions.

The interface now follows GOAT’s existing appearance system, and the demonstration uses English throughout. This gives the two applications a consistent presentation. The original GOAT baseline and the new Capstone work remain separately documented in our private repository.

中文提示：展示复用价值，但不捏造“节省了多少开发时间”。GOAT 聊天平台是既有成果，创业资料、行动进度和跨会话接续才是这次增量。

### 可补充

We use an existing Ollama model, gemma4:26b, on my local GPU. No paid model API calls were needed for this iteration. Electricity and hardware still have costs, so I would not describe the system as free to operate.

## Slide 4: First consultation: campus dinner delivery

### 主讲

Our fictional founder wants to offer campus dinner delivery for students studying in the evening. The founder assumes that speed matters most, but has no interviews yet and can interview at most five people this week.

The first consultation asks about recent dinner purchases and why students chose their existing options. It proposes five interviews, with notes about the actual experience and the reasons behind each choice. That gives the founder a concrete task that fits the stated capacity.

The founder then reviews and saves the plan. At that point, five interviews are planned and zero are completed. The assistant’s recommendation does not change the completion count. This distinction matters because an attractive plan can otherwise look like progress that never happened.

中文提示：此页讲“首次记录”。当前保存档案已经是复盘后的状态，不要指着现有 5/2/3 说这是首次状态。可切到 First consultation 显示真实英文历史，明确这是此前的测试记录。

### 可补充

Even the initial questions need review. A question focused on delivery delays may give too much weight to the founder’s speed assumption. We need an EIR to judge the wording, as well as the suggested action.

## Slide 5: Follow-up: saved results change the advice

### 主讲

In the next visit, the founder reports completing only two of the five interviews. In this fictional case, both respondents say price mattered more than speed. The founder explicitly confirms those results in the profile.

I then open a new session and send a short review request without pasting the earlier conversation. The service supplies the saved venture state. In the recorded English test, the coach identifies five planned interviews, two completed interviews, and three remaining. It changes the next recommendation to explore price and existing alternatives.

The response also explains the limits of two convenience samples. They do not establish market demand or willingness to pay. The useful result here is continuity through partial progress, with the evidence limits still visible.

中文提示：亮点是新会话可以接上已确认状态，不是宣称模型已经理解整个市场。以下选择“实时演示”或“记录回放”，不能混称。

### 现场演示：约 90–120 秒

演示入口：[Virtual EIR](http://127.0.0.1:62607/)。保留项目：`Campus dinner delivery (English verification, fictional)`。清理后 Venture 菜单只剩该项目。已有 First consultation 和 Follow-up 1 两次英文会话。

1. 先指向顶部 `Saved context · 5 planned / 2 completed / 3 remaining · Revision 4`。

   **Say:** “Here is the confirmed state. Five interviews were planned, two were completed, and three remain. The founder recorded the price feedback and its small sample size.”

2. 点击右上角 `Venture profile`，展示客户、假设、证据与行动进度，然后关闭。只查看，不点击 `Prepare five-interview plan`、`Prepare two interview results` 或保存，避免重置现有演示状态。

   **Say:** “The founder controls these records. The saved evidence includes its source and limitation. An AI suggestion alone cannot mark an interview as completed.”

3. 点击侧栏 SESSIONS 旁的 `+`，也就是 `New follow-up session`。这是会新增会话的真实操作，不会改变已确认的访谈完成量。确认对话区为空。

   **Say:** “This is a new, empty conversation. I will send a short question, without copying the previous chat.”

4. 点击 `Review saved interview results` 填入英文模板，核对后点击 `Send message`。模板为：

   > I have saved the latest interview results. Review them against the previous action plan. How should I adjust the next step? Explain the limits of the evidence.

   **等待时说：** “The application loads the confirmed profile for this venture and sends it with the current request. This local interface displays the reply when the model finishes.”

5. 根据这次**实际输出**指认完成量、剩余任务、价格发现和样本局限。不能预先保证新输出逐字一致，缺了某点就直接说明。

   **If present, say:** “The reply connects the two completed interviews to the original plan and explains why we need more evidence. I did not include those details in the message I just typed.”

6. 如果出现假设性的付费意愿问题，主动承认边界：

   **Say:** “This suggested willingness-to-pay question still needs improvement. We want the next version to ask about actual recent purchases rather than treat a hypothetical answer as purchase evidence.”

   中文提示：这句话说的是计划，不能说“已经修好了”。记录中的 $3 / $5 只是模型问题举例，不是定价结论。

### 慢响应或失败时的英文备用台词

The live response is taking longer than expected, so I will show the English test recorded on October 8. This is a recorded model response, not a live one. It shows the same saved-context flow, and the original input and output are available for inspection.

操作：回到已有 `Follow-up 1`，指认保存的真实英文回复。若服务整个不可用，打开 [英文原始运行记录](../../docs/archive/2026-10-08-english-demo.json)，查 `followup_response.reply`。JSON 比较长，演示前预先定位。不要使用旧中文输出的英译来冒充模型英文原文。

## Slide 6: Founder confirmation and coaching flow

### 主讲

The flow places founder confirmation between advice and the next consultation. The assistant can propose a task, but the founder decides what to save. When work happens outside the application, the founder records the result and can correct earlier information.

For example, I corrected the target customer from students generally to graduate students studying in the evening. The saved profile retains the correction and its revision. Future requests use the current confirmed state.

This makes the source of each update easier to examine. It still relies on the founder’s report, which we cannot independently verify. Automatic fact extraction and session summaries remain future work. We first want to test whether this explicit confirmation process is useful and understandable.

中文提示：人工确认保证“用户控制记录”，不保证“用户输入的事实一定真实”。不要声称后台已做自动总结、RAG 或自动提取。

### 可补充

The interface also warns about unsaved profile or message drafts before switching context. That helps keep a correction from disappearing during the demonstration.

## Slide 7: Demonstration evidence and current limits

### 主讲

We have actual English model responses for the initial consultation and the follow-up. We also checked profile correction, recovery after restarting the service, and rejection of a session requested through the wrong venture ID.

Those checks support the implementation. They do not establish the quality of the coaching. The response still includes a hypothetical payment question, and we have not obtained expert ratings or tested outcomes with real founders.

The current application also lacks user authentication and has unresolved dependency security warnings. I therefore keep this version on the local machine and use fictional cases. Before shared use, we need user authorization and security work, followed by evaluation in the intended deployment environment.

中文提示：项目关联隔离不等于用户授权。不要说“隐私完全安全”“可以给所有同学上线”。不把测试通过当成专家认可。

### 可补充：老师问速度或验证范围时

The recorded English calls took about 13.5 seconds and 8.8 seconds on this machine. These are individual measurements, not a response-time guarantee. The application’s automated checks cover persistence and UI behavior. We still need a separate rubric for relevance, evidence handling, and the usefulness of the next action.

## Slide 8: Next steps and feedback requested

### 主讲

I would like your feedback on the intake information and the follow-up. Which missing detail would change an EIR’s advice? Does the suggested next action help the founder collect useful evidence? Is the confirmation step clear enough for someone returning after partial progress?

With those gaps identified, we can take a specific example to Ain and request an approved mentoring template or anonymized case, subject to permission. We can then compare the general GOAT configuration with Virtual EIR on the same fictional scenarios and use a consistent scoring rubric.

I am handling the initial work this week. We will confirm team roles and repository access next week. Local testing needs no paid API key today. If evaluation suggests a cloud model would help, we will first propose a provider and a spending cap.

### 收尾

The first-week deliverable is a working example of a founder returning with incomplete work and new evidence. The next priority is to check whether the resulting advice is useful enough to justify the next iteration.

中文提示：最后请老师评价“这套流程是否有用”，不要只问“您觉得怎么样”。Ain 材料、专家评审和云预算都还未获批。

## Slide 9: Appendix: implementation and validation

仅在老师问实现时用，不占主讲时间。

GOAT and Virtual EIR run as separate local services. EIR reads the confirmed profile and the current session history, then calls GOAT’s existing chat endpoint. GOAT connects to the local Ollama model. SQLite stores the profile revisions and full EIR conversations.

The remote Windows workflow passed for the English interface update. Earlier Windows path-comparison failures required a fix, and we keep that correction in the implementation record. This workflow covers our prototype checks. It does not establish that every upstream quality or security gate has passed.

The private repository synchronizes source code and documentation. Model files and runtime databases stay outside Git. Moving the current demonstration to another device requires a separate private data backup and local installation.

中文提示：本稿核实 run `37844817779`、提交 `525769a` 已 success。后续提交的 CI 可能变化，展示前再核对。GOAT PR #28/#29 未合并，不说“已发布上游”。

## Slide 10: Appendix: recorded demo fallback

The fallback uses the actual English input and model output recorded on October 8. The saved case contains an initial consultation and a separate follow-up. We can inspect the original record alongside the confirmed plan and result.

Everything in the venture is fictional. The two interviews are demonstration data. They do not represent research with real students. The recorded reply includes limitations that we want an EIR to review, including its hypothetical payment question.

中文提示：PPT v2 的旧备注仍可能写中文原文/英文意译。现场应使用本稿和新英文记录，并清楚说 recorded。

## 五个值得强调的亮点

这些是有具体依据的补充台词，不需要全部另读一遍。

| 亮点 | 一句话英文 | 指向的证据 |
| --- | --- | --- |
| 新会话接续 | “A new conversation can use the venture’s confirmed state without asking the founder to paste the previous chat.” | 空会话、简短请求、真实 follow-up |
| 区分部分完成 | “Five planned interviews remain distinct from two completed interviews.” | 顶部 5/2/3 和行动记录 |
| 用户控制更新 | “The founder confirms changes, and the application keeps profile revisions.” | 档案编辑与 revision 4 |
| 复用已有平台 | “The Capstone adds venture continuity on top of the existing GOAT platform.” | GOAT 模型连接、共享外观、独立 EIR 层 |
| 保留证据局限 | “The reply can acknowledge new evidence while explaining why two samples are insufficient.” | 真实回复中的 small sample / selection bias |

最后一项只代表已观察到的回复行为，不宣称所有模型、输入都能稳定做到。

## 备问：详细但可直接说的英文回答

### Why would someone use this instead of a general chatbot?

Our proposed benefit is less repeated setup and a clearer record of the venture’s progress. The founder can see what they confirmed and whether they completed the previous task. We still need a direct comparison with a general chatbot to measure whether that actually improves the experience or advice.

### Is this replacing an Entrepreneur in Residence?

We are exploring support between mentoring conversations. A human EIR still provides judgment and experience that we have not validated in this system. The prototype does not book an EIR appointment or represent an approved Ain service.

### What does “memory” mean here?

The service automatically loads an explicitly saved venture profile for a new session. The founder still confirms the facts and results. We have not implemented automatic extraction, long-term conversation summaries, or a retrieval knowledge base.

### What happens if the founder reports something incorrect?

The founder can edit and confirm a corrected profile. The service uses the latest confirmed revision on the next request. We retain earlier revisions, but we cannot independently verify that a reported interview actually happened.

### Why use a small fictional example?

It makes the continuity test easy to inspect. We know the original plan, the reported results, and the change in the next request. A fictional case also keeps real founder data out of an application that is still missing authentication. It cannot substitute for real-user evaluation.

### How will you evaluate the coaching?

We plan to give both configurations the same fictional scenarios and score whether they ask relevant questions, distinguish assumptions from evidence, and propose a feasible next action. We would also check memory accuracy and whether advice changes after new results. Expert review depends on availability and permission, and we have not collected those ratings yet.

### What is the most important weakness today?

The follow-up remembers the state, but some suggested interview questions could encourage speculative answers. I would prioritize questions about actual purchases and then ask an EIR to review the wording. Continuity alone does not guarantee sound coaching.

### Does local execution guarantee privacy?

Local execution keeps this demonstration’s model calls on the machine. It does not replace access control or a security review. We use fictional data, keep the application on loopback, and exclude runtime databases from Git. Shared use requires additional safeguards.

### What happens when moving to another device?

GitHub brings the code and documents. The other device still needs dependencies and an appropriate local model. The current venture data requires a separate private backup. We have verified restart persistence on this machine, but we have not completed a cross-device data recovery exercise.

### Do you need a paid model API key now?

No. We used the existing local model and GPU for this iteration. If a comparison shows a cloud model is necessary, we will propose the provider, expected usage, and spending cap before making paid calls.

### Has Ain approved the framework, and who is doing the work?

Ain has not approved this framework. These are our initial drafts for discussion. I am responsible for the first-week setup, and we will confirm group roles next week. We also document the earlier GOAT code separately and need to confirm the course’s expectations for reuse.

## 约五分钟短版

用于老师时间很紧时。按这段串讲并插入一次演示，不读备问或可补充段落。仍需实际排练。

**Slides 1–2:** “Our first Virtual EIR prototype tests continuity between founder consultations. It implements the user journey, profile, and coaching framework we discussed, using a fictional venture for feedback.”

**Slide 3:** “GOAT provides the existing chat platform and local model connection. The Capstone adds confirmed venture state, action progress, and profile revisions. The demo now uses English and GOAT’s appearance system.”

**Slide 4:** “Our fictional founder assumes delivery speed matters most and can interview five students. The first consultation proposes a concrete task, which the founder reviews and saves. Planned work and completed work remain separate.”

**Slide 5 + demo:** “The founder returns after two interviews and reports that price mattered more than speed. Here are five planned, two completed, and three remaining. I will open a new session and ask for a review without pasting the earlier chat.”

展示实际结果后： “The reply uses the saved state and explains the limits of the two samples. Its hypothetical payment question still needs expert review.”

**Slides 6–7:** “The founder controls saved facts and can correct them. We verified the local flow and restart persistence, but have not established expert coaching quality. This is a local fictional demo without user authentication.”

**Slide 8:** “I would value feedback on missing intake information and the usefulness of the follow-up. Next, we plan to bring this example to Ain and compare it against general chat using the same scenarios. Local testing needs no paid API key today.”

## 会前检查

- 启动服务，检查两个入口、Ollama 和 `gemma4:26b`，但不要为演示再次跑会创建一堆项目的全量实机测试脚本。
- 刷新已有 EIR 标签，确认 Venture 中只有保留的英文案例，已有两次英文会话，顶部是 5/2/3。
- 预先查看 First consultation 和 Follow-up 1，理解原文，别逐字读长模型回复。正常直播可新建会话，不需要覆盖档案。
- 输入框及档案不留未保存草稿。准备好英文原始记录的备用位置。
- 自己在 PowerPoint 放映一次并计时。PPT v2、内容 JSON 和旧备注仍是历史快照，当前讲稿请打开本文件。
- 核对实际例会邀请、课程对复用的要求，以及展示时的 CI 状态。没有核实最新会议时间，不把旧“周五 11 点”写成已确认安排。

## 证据与来源

- [本周会议方向与 W1–W5](../../docs/WEEKLY_DELIVERABLES.md)：根据之前已归档的会议转录整理，本次未重新打开分享页或读取当前会议邀请。
- [三个草稿及原型边界](../../docs/PROTOTYPE_BRIEF.md)。
- [英文首次/跟进的真实输入输出、5/2/3、修正与重启证据](../../docs/archive/2026-10-08-english-demo.json)。
- [实际英文策略测试](../../docs/archive/2026-10-08-language-proof.json)与 [21 组 UI 检查记录](../../docs/archive/2026-10-08-english-ui-proof.json)。
- [实施归档与未解除的门禁](../../docs/archive/2026-10-08-goat-reuse.md)、[本地操作说明](../../docs/LOCAL_RUN.md)。
- [英文/UI 提交的已通过 Windows CI](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37844817779)。
- [GOAT 复用基线](https://github.com/mingzhi0119/GOAT_AI/tree/9788ffab4a70f3dec6406778d1dc26f302b762f8)。

英文讲稿中的分析是汇报解释，不是模型原文逐字引用。需要检查模型措辞时，以英文 JSON 记录或保存会话为准。所有访谈数量、市场观察和创业者资料都是虚构示例。
