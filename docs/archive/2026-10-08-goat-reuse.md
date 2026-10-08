# 2026-10-08 GOAT AI 复用归档

本文件仅记录本轮已执行结果。测试案例使用虚构资料。

## R1：源码基线导入（完成）

- 来源：`https://github.com/mingzhi0119/GOAT_AI`。
- 上游 main：`9788ffab4a70f3dec6406778d1dc26f302b762f8`。
- 导入方式：`git subtree add --prefix apps/goat <已核对的本地上游克隆> main --squash`。
- 导入的是完整源码，不是只保存链接；Git subtree 记录来源 SHA，没有嵌套 `.git`。
- 上游原仓库与线上部署均未修改。Capstone 后续增量单独记录，避免把已有平台能力认作本周新开发。

## R2：本地条件（完成）

- NVIDIA GeForce RTX 5090，显存 32607 MiB，驱动 616.92；这是实际 `nvidia-smi` 结果，不代表推理已经验证。
- Python 3.14.4；Node v24.14.1；npm 11.11.0。
- Ollama 0.20.0；`GET http://127.0.0.1:11434/api/tags` 已成功。
- 已有 `gemma4:26b`（约 18GB）、`qwen3.5:35b-a3b`（约 24GB）、`qwen3:4b` 等模型。先测试现有模型，不下载、不升级。
- 服务尚未实测；R3 起记录构建、模型调用和存储证据。

## R3：基线运行（完成）

- 依赖安装成功，前端构建成功。
- 后端与契约：514 passed、8 skipped、10 subtests passed；前端限制两 worker 后 217 passed / 50 文件；此前一例并行失败已单文件及完整复测通过。
- Ruff、import-linter、后端契约同步、前端 lint、depcruise、contract:check 均通过。
- GOAT `127.0.0.1:62606`；health 正常；ready 的 settings/SQLite/Ollama 均通过，数据库 `var/goat/chat_logs.db`。
- 首轮 120-token 测试只有思考并 error，不视为成功。1024-token 复测成功，保存 session `eir-baseline-full-20261008`，历史接口读取两条消息且 schema_version=5。
- 实际回复："Validate the existence and severity of the pain point through direct interviews with potential users before building any solution."
- Ollama GPU 加载 gemma4:26b，size_vram 21953691008，context_length 32768。

## R4：差距与决策（完成）

- [完成情况报告](../GOAT_AUDIT.md) 已区分运行证据、静态能力、风险和生产阻断。
- [实施决策](../GOAT_REUSE_DECISION.md)：独立 EIR 层 + 现有 GOAT HTTP chat + 独立 SQLite；源码不改 upstream chat contract，不扩大只读 project_memory。
- 本地控制可用于虚构单用户演示；依赖审计与无登录问题并未消失，公网发布仍受阻。

## R5：确认式创业资料（完成）

- 独立 `eir/store.py` SQLite：ventures、revisions、sessions，稳定 UUID、外键和版本冲突检查。
- 已实现资料、假设、带来源及样本局限的证据、行动（target_count/completed_count 分开）。模型无资料写入权限；用户明确 PUT 确认，留存每个版本。
- 12 个新增确定性测试通过，覆盖两会话、重新打开数据库、资料纠正、项目隔离、非法输入、截断/报错流、离线模型、跨来源拒绝及同会话并发拒绝。
- 路线图 R6 仍待真实教练调用完整通过，不把 mock 模型测试登记成真实演示成功。

## R6：文字教练连通（完成）

- EIR `127.0.0.1:62607` 实际复用 GOAT `127.0.0.1:62606/api/chat`，Gemma 26B 生成首次回答和新会话复盘。
- 第一轮完整测试首次 17.956s、跟进 15.588s；全新跟进 turns=[]，仅简短复盘请求，不粘贴旧对话。
- 模型主动读取保存状态：目标 5、已完成 2、剩余 3，并指出价格 vs 速度的新发现及样本限制。
- R7 质量检查发现首次建议样本数超出五人预算（10–15）。已收紧提示和初次输入的可用时间约束，将重新验收，不隐去这个失败。

## 运行中发现的兼容缺陷（修复并验证）

- GOAT 将 `think` 传入 Ollama options 而非顶层字段，导致关闭思考不生效。EIR 首轮 2048-token 仍未产出有效完整答案。
- 已按 [Ollama 官方 chat 参数](https://docs.ollama.com/api/chat) 和 [thinking 文档](https://docs.ollama.com/capabilities/thinking) 修复本地 subtree 的五种调用路径；不更改 Capstone 私有仓库之外的原仓库。
- 新增 26 个传参回归用例；包含旧 client 与黑盒的一组 88 tests 全通过，API 契约同步通过；真实两会话已成功。未变更公共 OpenAPI schema，不重生成契约文件。

## R7：真实两会话与回归（完成）

- [真实模型证据](2026-10-08-real-demo.json)：收紧首次五人预算后复测，首次 17.617s、跟进 16.088s。
- 首次实际提出两条问题并解释依据，行动包含目标、五人、非引导式询问与记录指标；第二次读到 5/2/3，建议把剩余三次重点转向价格/价值及替代方案，说明两个样本不代表市场。
- 新会话 turns=[]，输入不包含旧对话或五/二/价格结果的重复说明；这些来自已保存状态。模型没有把 planned=5 改成 completed=5。
- 实际停止并重启 EIR，profile 与 session 完全恢复；跨项目 session 请求为 404；客户字段修正持久保存。
- [自动 UI 行为证据](2026-10-08-ui-proof.json)：13 项，包含真实页面重载、确认保存、新会话、未保存草稿、非法 JSON、项目切换失败和列表刷新失败。UI 的模型错误/成功反馈边界使用 mock，真实模型另见上一证据，不混为一谈。
- EIR 18 个确定性测试通过；修复后 GOAT backend/contracts 540 passed、8 skipped、10 subtests passed；Ruff、format、contract sync、import-linter 通过。
- 只读复核发现并修复：无效 SSE token 的 500、SQLite 连接未确定性关闭、继承环境路径绕开项目存储、UI 项目/会话混用与保存回复被刷新错误遮住。
- 质量限制：模型偶有不严谨证据解释和假设性的付费意愿提问，未做 EIR 专家评级；这是后续 R11 的优先评估项，不宣称专家认可。

## R8：部署、归档与 GitHub 同步（远程验证重新打开）

- 一键 `start-local.ps1 -Install` 实际完成依赖安装、GOAT 构建与两个 loopback 服务启动；安全停止/重启保留数据，只停止本项目进程，不停止 Ollama。
- 注入无效继承环境（错误 Ollama 地址及非项目存储路径）后重新启动，项目脚本明确固定正确配置；`var/unused-test.db`、`var/unused-data` 均未创建。
- 上述启动后的最新真实模型复测：首次 20.785s、跟进 14.375s；重启恢复、修正与项目隔离仍通过；完整输出更新在真实证据 JSON，不把更早时长标成最新结果。
- 完整源码已推送私有 GitHub，独立目录 clone 验证 `apps/goat/server.py` 与 `eir/app.py` 同时存在；代码同步不是模型/数据库同步。[部署说明](../LOCAL_RUN.md) 已解释前置环境、备份与未完成的跨设备数据恢复演练。
- 更正：GitHub [run 37835443569](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37835443569) 状态曾为 success，但详细日志中实际有三个路径断言失败，后续命令掩盖退出码。不能将此前“全部成功”保留为验证结论。加入 fail-fast 的 [run 37837203095](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37837203095) 正确阻断，等待本轮修复后的远程结果。
- 最后补会话选择边界：新会话创建成功后立即记住 ID，即使列表刷新失败也能在重载后选中；新增此回归后 Edge 自动行为检查为 14 项，连续三次通过。测试的初版等待条件误把旧项目“版本 1”当新建完成，已改为等待新建完成状态及按钮解锁；保留这项测试修正记录。
- 本周清单、原型设计状态、主路线图与来源标注已同步更新；后续 R9–R16 保持未勾选。无组员邀请或付费模型调用；上游修复 PR 状态另见下节。

## 上游 PR 与远程路径断言修复

- 用户已授权直接修复上游并提 PR，不要求保留不正确实现。[PR #28](https://github.com/mingzhi0119/GOAT_AI/pull/28) 修正 `think` 字段位置并补文档/26 回归；上游独立克隆验证 540 passed、8 skipped、10 subtests passed，契约与分层检查通过。
- 远程三个失败都比较未解析的临时路径与对象存储返回的已解析路径。用工作区内 Windows junction 作为 TMP/TEMP，旧测试出现相同的 3 failed/14 passed；改用 resolve + is_relative_to 后同一组 17 passed，完整 backend/contracts 540 passed。
- [PR #29](https://github.com/mingzhi0119/GOAT_AI/pull/29) 仅修正这三个测试的路径比较，上游该 17-test slice 也在 junction 条件下通过。生产存储代码和路径逃逸拒绝保持不变，不是跳过失败测试。
- PR 均未合并。上游 CI 现有 lint 工具版本漂移和前端高风险依赖另有阻断，本轮不冒称可合并或安全绿色，不禁用门禁。
- 修复提交 `93d1aec` 的本项目 [run 37839067814](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37839067814) 在材料交付检查时仍运行中：Python 安装与 EIR lint/18 项确定性测试步骤已通过，GOAT backend/contracts 尚未结束，前端待运行。R8 保持未勾选；上游 PR #29 的 CI 也为失败，不把本地回归当远程全绿。

## R17：第一周 PPT 与演讲稿（完成）

- 材料保存在 `deliverables/2026-10-08`：`Virtual-EIR-Week1-v2.pptx`、`Speaker-Script.md`、`Slide-Content.json` 与使用说明。可重建源码为 `tools/presentations/build-week1.mjs`。
- 10 页英文 PPT：8 页主讲 + 2 页备问；全部有英文 Speaker Notes 和来源，5 页采用可编辑原生表格。讲稿含中文提示、现场演示插入点、明确说明非直播的录制备用方案与常见问答。
- 内容区分 GOAT 既有能力和 Capstone 增量；使用虚构创业项目及中文输出的英文意译，不声明真实学生访谈、EIR 认可、安全上线或上游 CI 全绿。
- 成果包、字体、布局、原生表格、重新导入检查通过；重新导入渲染全部 10 页并逐页检查，无可见重叠或裁切。检查结果在本地忽略目录 `var/presentation-build-20261008`；原生 PowerPoint 放映与计时排练尚未执行。
- PPT SHA256：`ac6ec6438900406275c326eb7c2f43645fa5fdb4a697f474655a65dbb97daada`。旧草稿移至本地构建目录保留，未删除。
- 时长是排练规划：约 5 分钟主讲，另留 60–90 秒演示。第 9 页是制作时 CI 快照；当前状态仍以本归档后续条目和 GitHub 为准。

## R18：上游修复提交（完成）

- 已提交且已关联本任务的 PR #28/#29 见上节。此处打勾仅指完成修复、局部/本地回归、提交 PR；不代表已合并或 CI 门禁解除。
- 路线图保留 R14 依赖整改，并新增 R19 上游 Ruff CI 基线修复。邀请组员仍按用户要求留到下周，尚未邀请。

## R8 远程复测关闭；R20/R21 英文演示与 GOAT 外观（完成）

- 已核实 fail-fast [run 37839067814](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37839067814)，提交 `93d1aecb9e1937ef0c4c5a3d140e2e726aa36c07`：EIR 18 passed、GOAT 540 passed / 8 skipped / 10 subtests、前端 217 passed / 50 files，契约与分层检查成功。上述“pending”是更早的观察快照；R8 现在关闭。英文/UI 新提交不借用该运行的结果。
- 英文部署使用现有 `GOAT_SYSTEM_PROMPT` 和明确 `GOAT_USE_CHAT_API=true`，清空文件覆盖路径；三个主题的基线提示均被此 Capstone 配置覆盖。未修改上游通用多语言默认、API schema 或生成契约，也没有为 Capstone 英文定制新增上游 PR。
- [真实英文两会话](2026-10-08-english-demo.json)：首次 13.471s、复盘 8.840s；英文输入、资料和模型原文，不是中文意译。复盘正确读取 5 planned / 2 completed / 3 remaining、价格 vs 速度变化及小样本限制；真实进程重启后资料/会话恢复、跨项目 404、客户修正通过。虚构项目 ID `2a64b54d-7c5c-4121-b6c4-194aaedf40dc`。
- [语言边界实测](2026-10-08-language-proof.json)：英文业务问题、中文输入+旧中文历史+冲突偏好、EIR 中文资料/输入，最终三项回复英文且无 CJK，确认资料未改。最初软提示在冲突场景回复中文；“重复基础提示”实验仍失败，已经撤掉该无效上游代码/测试修改。改为更明确的部署语言指令后 GOAT 通过；EIR 曾在英文回复中原样引用中文项目名，补数据结束标记与英文描述指令后通过。保留这段失败记录，不称第一次就成功。
- EIR 界面直接导入 GOAT 的真实 appearance 模块、数学规范化与现有 React/Markdown/KaTeX/Lucide；不复制主题 token、不引入新依赖。相同三主题、字体、图标、明暗与圆角聊天布局；确认资料移到弹窗，高级 JSON 折叠，行动/证据以摘要显示。偏好按端口分别保存，不声称自动跨端口同步。
- [UI 证明](2026-10-08-english-ui-proof.json)：21 组 headless Edge 检查通过，涵盖字段/JSON同步、X/Escape保留草稿、非法 JSON 禁止字段覆写、starter 不覆盖未发消息、发送锁定、确认冲突、成功回复/新项目/新会话在刷新失败后仍保留、六主题配置与重载、1440/900/390宽度及844×390/390×350低高度、无模型反馈/弹窗内重试、Markdown/数学与恶意 HTML/链接/远程图片安全边界。
- 实机浏览器已查看真实英文复盘及 GOAT 的真实英文回复，另查看欢迎页、档案弹窗、主题与低高度自动截图结果；未称专家评审。界面截图在本地忽略目录 `var/eir-ui-review`。代码/UI验证：EIR 24 passed，GOAT backend/contracts 540 passed / 8 skipped / 10 subtests，TypeScript、ESLint、Ruff/format、构建、契约同步、import-linter 成功。给提示末尾加说明后，旧 mock 把整个余下字符串当纯 JSON，导致五个测试失败；已按 JSON 原始解码边界修正 fixture 并复测，生产协议未改。
- 英文约束仍是提示策略，不是确定性语言防火墙；不能从无 CJK 推断所有语言/模型都被硬性限制。历史中文记录与早期中文证据保留。老师演示用新英文项目；旧 v2 PPT/讲稿保留为制作时快照，现场步骤以新版部署说明为准。
- GOAT 前端再次全量回归：双 worker 216 passed / 1 failed，原有图表关联测试在 `Loading responses` 状态等不到 `Earlier answer`。单文件 28 passed，单 worker 完整 217 passed / 50 files。外层 CI 采用单 worker 的同一全量套件，不跳过断言、不增加生产代码改动；资源/异步时序稳定性仍可继续改进，不称该原测试从此永不波动。
- 质量仍待审阅：复盘里仍出现假设性的付费意愿问题，自动测试和外观改进不等于专家认可。无账号/授权、依赖 high 警告、跨设备真实数据灾备演练等门禁未关闭。无邀请组员、付费 API、合并 PR 或扩大监听范围。

## 仍然有效的风险

- 上游旧 PROJECT_STATUS 的登录描述与当前公开 demo 配置不一致；以当前代码和运行结果为准。本轮只允许 loopback 本地部署。
- GOAT 聊天历史及只读 project_memory 不能替代可编辑的创业资料、待验证假设和行动状态。
- GPU 加载与跨会话恢复已经实测；模型质量仍未经过多案例或 EIR 专家评估，不能由一次运行成功推断。
