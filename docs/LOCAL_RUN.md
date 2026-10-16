# 本地启动、演示与换机

版本提示：第 1–7 节保留 2026-10-08/09 的运行/演示快照；“当前案例/会话数量”是当时状态。October 16 Week 4 foundation 的当前入口、隔离测试、数据兼容和未完成验收见新增第 8 节。旧快照不代表新功能已经发布到 Vercel。

验证环境：2026-10-08，Windows、Python 3.14.4、Node 24.14.1、Ollama 0.20.0、RTX 5090（32GB）。本轮选择已安装的 `gemma4:26b`，实际加载约 22GB 显存。其他模型可在界面选择，尚未用同一量表评估；其他操作系统未完成部署验证。

## 1. 新设备 / 首次安装

先安装 Git、Python 3.14、Node 24、Ollama，登录能访问私有仓库的 GitHub 账号。启动 Ollama，准备适合该机器显存的模型；本轮未下载模型或升级 Ollama。

```powershell
gh repo clone mingzhi0119/Virtual-EIR-Capstone
Set-Location Virtual-EIR-Capstone
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Install
```

`-Install` 创建 `apps/goat/.venv`、安装上游 CI 依赖、执行 npm ci 和前端构建。每次启动都会用同一 lockfile 的现有依赖构建 EIR 外观模块；生成文件不进 Git，新设备必须有 Node 和前端依赖。优先使用已有 uv，未安装 uv 时使用 venv pip。源码已完整 subtree 导入，不需要 `git submodule update` 或再克隆 GOAT。

本机已安装依赖，以后启动：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

入口：

- [Virtual EIR](http://127.0.0.1:62607)：创业资料与连续指导。
- [完整 GOAT AI](http://127.0.0.1:62606)：保留原 React 聊天平台。
- Ollama：`http://127.0.0.1:11434`。

脚本仅复用本项目、对应入口、loopback 的现有进程；端口若被其他程序占用会报错，不杀未知程序。服务后台隐藏运行；输出在 `var/*-stdout.log`、`var/*-stderr.log`。health 成功不等于模型回复成功，首次演示仍须发送消息。

## 2. 本周两会话演示

当前机器已有干净的英文案例：`Campus dinner delivery (English verification, fictional)`，包含 First consultation 与 Follow-up 1，顶部 5 planned / 2 completed / 3 remaining / Revision 4。2026-10-08 已清理 47 个无用实验项目并做本地备份，见 [清理归档](archive/2026-10-08-demo-cleanup-and-script.md)。老师现场可直接用该案例，新建跟进会话即可，不要点击准备模板覆盖已有结果。详细英文操作台词见 [讲稿 v3](../deliverables/2026-10-08/Speaker-Script-v3.md)。

以下步骤用于从零构造一个新的虚构案例，不要求每次演示重复执行。

1. 打开 EIR，刷新旧页面，点击 `New fictional venture`，模型选 `gemma4:26b`。界面、资料和输入模板均为英文。
2. `Start the first consultation` → `Send message`。问题模板只填入输入框，不自动发送；说明两个问题、五次访谈和为何记录实际经历。
3. 阅读建议，打开右上 `Venture profile` → `Prepare five-interview plan` → 审阅字段/行动摘要 → `Confirm and save profile`。高级 JSON 收在折叠区；这是人工确认，不是模型自动写库。
4. 在档案弹窗里点 `Prepare two interview results` → 检查 Planned: 5 / Completed: 2 / Sample: 2 → 确认保存，关闭弹窗。
5. 清空或发送尚未发送的草稿，点击侧栏 `SESSIONS` 旁的 `+`（`New follow-up session`）→ `Review saved interview results` → 发送。新会话没有旧对话，但服务端加载同一 venture_id 的确认资料。
6. 观察回复主动提及已做两次、剩余三次、价格/速度的新发现和样本局限。重载页面检查恢复，也可切回第一次会话。

两次“填写”只是填入虚构演示模板；不做任何真实访谈的完成声明。资料可以自行修改，原始版本留在 revisions 表。模型无权确认 facts；调整行动仍需人工保存。草稿未保存时，发送、新建跟进和切换会话/项目会提示。

本轮英文两会话实测 13.5s / 8.84s，其他早期运行约 15–23s；不是 p95 或普遍承诺。界面等完整回复后显示；尚无中途取消。建议仍需 EIR 专家评估，不能用于真实法律、投资等决策。

设置按钮支持和 GOAT 相同的三种主题与 System / Light / Dark；不同端口的浏览器偏好分别保存，不宣称自动同步。启动脚本通过现有 `GOAT_SYSTEM_PROMPT` 配置设定 English-only 提示并明确使用 chat API；不修改上游通用多语言默认值。更改提示后必须重启对应服务，单纯刷新浏览器不会刷新后端缓存。

英文策略已经真实测试英文输入、中文请求、旧中文上下文及冲突偏好；这是模型指令，不是确定性的语言防火墙，不能保证所有模型/所有输入都服从。旧中文历史保留，不会自动变成英文；老师演示使用新英文虚构项目。课堂前先试发一次并检查回复。

## 3. 停止 / 重启

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-local.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

只重启 EIR 可以 `stop-local.ps1 -Service eir`。停止脚本会核对命令行与项目路径，仅停止本项目服务，保留数据库；不停止 Ollama，不删除任何数据。修改服务代码/提示词后要重启相应服务，现有进程不会自动加载新代码。

## 4. 数据与代码同步边界

- `var/eir/ventures.sqlite3`：创业资料、确认版本、会话内容。
- `var/goat/chat_logs.db`：GOAT 会话、persona snapshot 与运行元数据。
- `var/goat/data`：GOAT 文件/对象；`var/goat/logs` 和 `var/*log`：日志。
- Ollama 模型在它自己的本地存储中，不属于 Git 仓库。

GitHub 同步源码、文档、测试和虚构测试证据，不同步 `.venv`、node_modules、模型、数据库、日志或密钥。若需带当前演示状态换机：停止两个项目服务，私下备份完整 `var`，新设备安装依赖后恢复 `var`，再启动；只 clone 会从空数据库开始。真实资料必须使用获准且安全的传输渠道，不可提交 Git。

备份恢复未做完整灾备演练；本轮证明了真实进程重启后恢复，不把它夸大成跨设备运行数据同步已自动完成。

## 5. 验证命令

```powershell
apps/goat/.venv/Scripts/python.exe -m pytest tests -q
apps/goat/.venv/Scripts/python.exe -m ruff check eir tests scripts/verify-demo.py scripts/verify-english.py
apps/goat/.venv/Scripts/python.exe -m ruff format --check eir tests scripts/verify-demo.py scripts/verify-english.py
node apps/goat/frontend/node_modules/typescript/bin/tsc -p eir/frontend/tsconfig.json
node scripts/build-eir-ui.mjs
node scripts/verify-ui.mjs
apps/goat/.venv/Scripts/python.exe scripts/verify-demo.py
apps/goat/.venv/Scripts/python.exe scripts/verify-english.py
```

`verify-ui.mjs` 使用已安装 Edge + Playwright headless，21 组行为/布局/主题检查；运行错误反馈时 mock 模型，其他资料写入本地虚构测试项目。自动测试不是人工视觉审核；本轮另外检查了实际浏览器界面。`verify-demo.py` 真正调用本地模型、建立新的英文虚构项目、确认计划/结果、重启 EIR、测试隔离及修正，更新 `docs/archive/2026-10-08-english-demo.json`；早期中文 `real-demo.json` 原样保留。`verify-english.py` 保存边界输入的真实输出和逐项通过/失败标记到 `language-proof.json`，不是只查提示词是否包含 English。脚本会增加虚构测试记录，不覆盖已有项目。

GitHub 根工作流只覆盖 Windows 原型回归；不是上游全部 CI、浏览器/EIR 专家评估、依赖安全审计、Linux parity 或生产发布门禁。上游嵌套 `.github/workflows` 不会在 Capstone 自动运行。

## 6. 已知限制与发布阻断

无登录/用户授权，不用于多人、局域网或公网部署。项目 UUID 隔离只防止项目关联混用，不是用户访问控制。Ollama 本身的监听范围由用户现有安装决定，本轮未更改其全局配置。

依赖审计报告 26 项（13 high），未完成安全升级；没有称依赖审计 green。输入输出仍可能误判证据，模型偶尔提假设性的付费意愿问题，后续优先改善为实际行为证据并请 EIR 审阅。工具、语音、Ain 私有材料、微调、云 API、桌面打包均不进入本轮。

本轮未调用付费模型 API、未向老师索取 key；使用已有本地算力，未计电力费用。

## 7. 分享只读英文展示（2026-10-09）

给组员和老师查看：[Virtual EIR showcase](https://virtual-eir-showcase.vercel.app)。它仅包含 2026-10-08 虚构案例的真实英文记录和对应确认资料；可切换首次咨询/跟进、查看资料与主题，但不能聊天、新建或保存。生产域名已在未登录浏览器中验证，不需要本机服务在线。

这是独立静态项目 `virtual-eir-showcase`，不是把本地服务暴露到公网。未发布数据库、提示词、会议记录、后端源码或完整仓库，GOAT 原有站点未覆盖，仓库权限未更改。编译后的界面代码与虚构展示内容对访问者可见，链接可转发；`noindex` 不是访问控制。完整应用仍受 R14–R16 门禁限制。构建/重新部署见 [showcase/README.md](../showcase/README.md)，验收见 [部署归档](archive/2026-10-09-vercel-showcase.md)。

## 8. October 16 — Week 4 foundation runtime and isolated proof

Implementation date is October 16, 2026, not October 11. The local EIR backend on [port 62607](http://127.0.0.1:62607) was restarted with the new foundation. GOAT remains on 62606 and Ollama on 11434. Readiness was observed during the implementation session; before a later presentation, check the services and send a real message on an isolated fictional venture. Code/policy changes require restarting the corresponding service, not only refreshing the browser.

The new UI includes **Venture profile** background/preference fields and **Goal & Plan**. Save the profile explicitly. In the workspace, define an objective, success criteria and constraints; **Generate AI plan** creates a draft to review/edit/approve/reject. Fresh generation starts proposed work at zero with a warning; earlier reports remain in history. **Revise approved plan · retain reports** creates a new draft carrying existing reports. The recorded button workflow approves v2 retaining 2/5 and v1 history. Backend task-lineage/diff and stale-proposal fixes are implemented; final workflow/edge reruns passed and foundation architecture approval was obtained.

Record absolute completed counts with **Confirm task report**. Five task states, blocker/result fields and pause/resume/cancel controls are implemented. 2/5 = 40% of that task, not business validation. Unsupported goal achievement is blocked; full milestones, task owners/dates, criterion/evidence review and supported goal closure remain pending. New-session chat uses approved workspace context, but the dedicated Weekly Check-in feature remains future work.

### Data and compatibility

Workspace history is stored in separate `workspaces` and `workspace_revisions` tables **inside the existing SQLite database**, not a separate live database. Profile actions and workspace tasks remain separate; editing one does not automatically synchronize the other. New sessions load confirmed current state without requiring a pasted transcript.

The old-profile 5,500-character admission limit applies to legacy content excluding `founder_background` / `communication_preference`; background is separately bounded to 200 characters and preference to an enum. This keeps old profiles at the original limit loadable. Workspace context is capped at 1,600 serialized characters. The combined 8,000-character system-context budget first reserves common policy, Persona, planner instructions and workspace context, then includes the full venture profile if it fits. Otherwise it uses an explicitly partial view: omitted-item counts and shortened-field paths are included, strings are shortened through 120/80/40-character stages, and at least the first action/evidence/assumption is selected when present. Full saved data stays unchanged; the coach is warned that omitted text is unknown and to ask for details. Policies are not silently removed. Focused long-legacy/context tests passed; final combined regression remains pending.

Pre-migration backup: `var/backups/eir-pre-week4-20261016.sqlite3`, recorded integrity `ok`, one venture and three sessions. The implementation owner confirmed raw legacy rows unchanged and zero live workspace rows after migration. This is a migration snapshot, not a complete disaster-recovery exercise or final post-repair audit. Do not restore that backup over the current database as a routine demo step.

### Reproduce proof without touching the live demo

The workflow verifier is fixed to `http://127.0.0.1:62608` and must use `var/week4-proof/workflow.sqlite3`. Persona generation uses `var/week4-proof/personas.sqlite3` directly. Both share local GOAT/Ollama inference but keep test venture data separate from live `var/eir/ventures.sqlite3`. These are mutating fictional test scripts; they regenerate local JSON/screenshots and add isolated records. Preserve needed earlier proof before rerunning. Do not point old mutating demo scripts at the preserved live service.

If the isolated server is not already running, use a separate terminal from the repository root; do not start a second process on an occupied port:

```powershell
$env:EIR_DB_PATH = Join-Path (Get-Location).Path 'var\week4-proof\workflow.sqlite3'
$env:EIR_GOAT_BASE_URL = 'http://127.0.0.1:62606'
$env:EIR_HTTP_PORT = '62608'
apps/goat/.venv/Scripts/python.exe -m uvicorn eir.app:create_app --factory --host 127.0.0.1 --port 62608
```

Run verifiers in another terminal from the same repository root after the required services are ready:

```powershell
apps/goat/.venv/Scripts/python.exe -m pytest tests -q -p no:cacheprovider
node scripts/verify-week4-eir.mjs
apps/goat/.venv/Scripts/python.exe scripts/verify-week4-personas.py
```

Final foundation verification: **79 automated tests passed, including 42 workspace tests; 10 real-model workflow groups, 21 legacy UI groups and 8 mock-network edge groups passed**. Independent architecture re-review **APPROVED** the foundation and closed all seven findings after the scoped cleanup. Full R26, the six future features and strict Persona coaching-quality acceptance remain open. No CI-green or expert-endorsement claim is made.

### Evidence and presenter caveats

Raw local files: `var/week4-proof/workflow-real.json`, `persona-real.json`, `profile.png`, `draft.png`, `progress.png`, `followup.png`, `mobile.png`. The workflow proof normally ends at approved v2 with 2/5; inspect before presenting, or create a fresh fictional venture on the isolated server. Do not assume a replayed screenshot is a new live response. Local databases remain ignored. Curated fictional JSON and screenshots are versioned in deliverables/2026-10-16/evidence.

The eight-response Persona comparison is English with preserved follow-up counts/sample limits, but has known quality failures: founder/customer confusion in Engineer/Business initials, hypothetical payment probing and overstrong elasticity wording in Engineer follow-up, Artist typo `e.le.`, and occasional word-limit overruns. The initial unsupported statistical claim is preserved in `workflow-initial-statistical-wording.json`; the corrected workflow avoids it. Earlier Persona attempts remain in `persona-baseline.json` and `persona-pre-stereotype-guard.json`. No perfect language/quality guarantee or Ain approval is claimed.

Use the [Week 4 script](../deliverables/2026-10-16/Week4-Speaker-Script.md), [report](../deliverables/2026-10-16/Week4-Progress-Report.md) and [archive](archive/2026-10-16-week4-foundation.md). Main owner owns the final ten-slide PPT and quality notes. The old Vercel recording stays frozen; no public/cloud backend, invitation, licence/GOAT-source change or current green-CI claim is made. This documentation lane performs no commits or external writes.
