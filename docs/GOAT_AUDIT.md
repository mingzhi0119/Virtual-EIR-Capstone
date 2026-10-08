# GOAT AI 完成情况与复用差距

检查日期：2026-10-08；基线 `9788ffab4a70f3dec6406778d1dc26f302b762f8`。结论：可作为本地原型底座，不是现成 Virtual EIR，也不能称生产安全就绪。

## 已有与实际验证

| 能力 | 本轮证据 | 复用结论 |
| --- | --- | --- |
| FastAPI + React | 安装成功；`npm run build` 成功；构建产物本地生成 | 直接保留完整 GOAT 界面 |
| Ollama 真实聊天 | Gemma 26B 实际返回完整 token + done；历史接口返回保存的用户/助手消息 | 复用已有 `/api/chat`，不是新写模型调用替代原平台 |
| 健康/存储/模型服务 | `/api/health` 正常；`/api/ready` settings、SQLite、Ollama 全通过 | 本地部署可行 |
| GPU | Ollama `/api/ps` 显示 gemma4:26b，`size_vram=21953691008`，context 32768 | 已在 GPU 实际加载，不从安装状态推断 |
| 后端/契约测试 | 514 passed、8 skipped、10 subtests passed | 检查范围为 backend 与 contracts，未称全部测试通过 |
| 前端测试 | 初次并行 216 passed/1 failed；单文件复跑通过；限制 maxWorkers=2 后 50 文件、217 测试通过 | 记录并行敏感失败，不隐去第一次结果 |
| 契约与分层 | 后端契约同步、Ruff、import-linter；前端 lint、depcruise、contract:check 通过 | 本轮不修改生成契约 |
| 上传/RAG、图表、工具、桌面 | 源码/测试存在；未单独实际部署或运行全部功能 | 非本周核心，不把源码存在称现场完成 |

## 需要新增的创业指导能力

1. `session_id` 不会自动在服务端加载旧对话；GOAT 依据传入 messages 保存完整快照。EIR 必须自己加载当前会话历史。
2. `project_memory` 是 workbench 输出的只读检索，不会确认/更新创业者资料。
3. 新会话必须加载 stable venture_id 的资料、假设、证据和行动；不同项目不能混用。
4. 模型建议不能自动变成已完成事实；用户显式确认并版本化保存资料，计划数量与完成数量分开。
5. SSE 使用 `data: {type, token}`，不是 `event: token`；即使 HTTP 200 或收到 done，也要检查 error、实际非空回复。首轮 120-token 预算只生成思考并报错；1024-token 基线复测成功，教练用 2048。

## 风险分级与本地控制

- **P1 / 公网发布阻断**：当前是无登录 demo，旧 PROJECT_STATUS/API_REFERENCE 部分仍声称登录或浏览器隔离。配置明确拒绝历史 auth 开关；同一服务不提供多用户保密性。仅 bind 127.0.0.1、单用户、虚构数据。
- **P1 / 公网发布阻断**：`npm audit` 当前报告 26 项（13 high、8 moderate、5 low），包括构建工具和运行依赖；没有自动执行可能破坏 Tailwind/KaTeX 等的重大升级。不能据此发布或承诺安全已完成。
- **P2 / 文档漂移**：实际 session schema_version=5，部分文档仍写 v4；通过 API 使用，不手工硬编码旧存储格式。
- **P2 / 证据缺口**：旧 protected-flow E2E 与公开 demo 模式冲突；本轮不宣称浏览器 E2E、desktop、Ubuntu CI parity 已通过。
- 已修复的兼容问题：原代码把 `think:false` 放在 options 中而非 Ollama 顶层，首次测试因此只输出思考并耗尽预算；已修复本地 subtree 的五种路径，新增 26 项回归。原 GOAT 仓库未改。残余风险是模型输出不确定及幻觉，仍需检查非空完整回答和样本证据，不能把 HTTP 200 当成功。
- 外部依赖：老师/EIR 审阅、组员权限、生产访问控制均非本机测试可证明。第一周不邀请组员。

## 最小整改路线

R5–R8 已完成本地最小验收；公网/多人/真实敏感资料前，另做依赖安全升级、认证与授权、跨用户隔离、浏览器 E2E 和部署复核。不得把这些生产阻断移成已完成任务。

## 修复后的最终验证

本地 GOAT 后端/契约 540 passed、8 skipped、10 subtests passed；前端 217 passed；新增 EIR 18 passed、14 项 headless Edge 行为检查通过。真实 Gemma 两会话、新会话读取保存状态和重启恢复均通过。远程首轮 [run 37835443569](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37835443569) 的绿色状态掩盖三项 Windows 路径断言失败；fail-fast [run 37837203095](https://github.com/mingzhi0119/Virtual-EIR-Capstone/actions/runs/37837203095) 正确报红。三项失败已用 junction TMP/TEMP 在本机复现并修正，完整 540 项在该条件下通过，等待远程复测。检查范围及每次真实输出见 [归档](archive/2026-10-08-goat-reuse.md)，不代表完整上游 E2E、安全或 EIR 专家评估。

上游 [PR #28](https://github.com/mingzhi0119/GOAT_AI/pull/28) 提交传参修复及文档说明，[PR #29](https://github.com/mingzhi0119/GOAT_AI/pull/29) 提交路径断言修复，均未合并。上游 CI 另受现有 Ruff action 使用 0.16.10 而 requirements-ci 固定 0.15.9、前端依赖审计 high 阻断；本轮未关闭安全门禁或广泛升级依赖。
