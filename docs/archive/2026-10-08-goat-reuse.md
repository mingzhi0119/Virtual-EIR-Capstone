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

## 已确认的风险

- 上游旧 PROJECT_STATUS 的登录描述与当前公开 demo 配置不一致；以当前代码和运行结果为准。本轮只允许 loopback 本地部署。
- GOAT 聊天历史及只读 project_memory 不能替代可编辑的创业资料、待验证假设和行动状态。
- 模型质量、GPU 推理实际占用、跨会话恢复尚需实测，不从显卡或模型安装状态推断成功。
