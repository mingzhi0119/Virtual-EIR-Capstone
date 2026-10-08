# 演示数据清理与英文讲稿升级

日期：2026-10-08。直接依据用户本次要求清理无用实验项目、增加讲稿细节。不是新的老师历史承诺。

## R22：清理 Venture 菜单

- [x] 读取全部 48 个项目、资料及会话数量，核对均为此前虚构自动验证、UI fixture 或重复演示记录。
- [x] 保留英文案例 `2a64b54d-7c5c-4121-b6c4-194aaedf40dc`，保留首次与跟进两次英文会话，revision 1–4。
- [x] 仅停止经过命令行和绝对路径核对的本项目 EIR 进程。GOAT 和 Ollama 未停止。
- [x] 使用 SQLite backup API 建立独立一致性备份，核对 integrity_check=ok 和三表行数；不覆盖已有备份。
- [x] 按 [47 个明确项目 ID](2026-10-08-venture-cleanup.json) 在一个事务中删除关联 sessions、revisions、ventures。操作前校验清单、保留 ID 和行数，若数据变化则中止。
- [x] 事务内逐表核对保留项目所有原始字段完全不变，foreign_key_check 无错误，integrity_check=ok。
- [x] 重启 EIR，health/readiness 正常。实际浏览器刷新后 Venture 仅一个英文案例，原两次英文会话与 5 planned / 2 completed / 3 remaining / Revision 4 恢复。

| 表 | 清理前 | 移除 | 清理后 |
| --- | --- | --- | --- |
| ventures | 48 | 47 | 1 |
| sessions | 62 | 60 | 2 |
| revisions | 102 | 98 | 4 |

本地备份：`var/backups/eir-cleanup-20261008/ventures-before-cleanup.sqlite3`。

SHA-256：`e9e2d0c7c88c6dbc58324f04a092aeeb7becf56ca3343ff91087e36c8e6b237d`。

备份位于被 Git 忽略的 `var`，**没有上传 GitHub，也不会随 clone 出现**。已归档的英文/早期中文 JSON 运行证据未删除。`var/goat/chat_logs.db` 中 GOAT 自己的聊天历史未清理，本次只清理 EIR 项目菜单与其关联记录。

恢复边界：可从 SQLite 备份恢复。恢复前应先停止 EIR 并备份当前数据库；有清理后新资料时，应按指定 ID 将备份中的 venture、revisions、sessions 一并恢复，而不是覆盖整库。全库恢复会同时撤销清理后的更新。尚未做完整灾备恢复演练，不声称已验证跨设备迁移。

测试脚本 `verify-ui.mjs`、`verify-demo.py`、`verify-english.py` 会再创建虚构实验记录，本轮不重跑这些会写演示数据库的脚本。未来完整测试宜使用独立演示数据目录/服务实例；本次没有偷偷增加按名字自动删项目的功能。普通使用及现场新建跟进只增加该项目的会话，不需要新建 Venture。

## R23：升级演讲稿

- [x] 新建 [Speaker-Script-v3.md](../../deliverables/2026-10-08/Speaker-Script-v3.md)，对应原 10 页顺序。
- [x] 增加英文逐页主讲、可选展开、中文指屏提示和 90–120 秒现场操作。明确当前档案已是复盘状态，不假装再次显示首次的 5/0 状态。
- [x] 增加五项可展示亮点：跨新会话接续、部分完成量、人工确认与修正、复用 GOAT、保留证据局限。
- [x] 增加 11 组英文备问，包含与通用聊天的差别、真人 EIR 角色、记忆机制、评估方法、迁移、隐私、费用与成果归属。
- [x] 增加约五分钟短版及失败时真实英文记录备用台词。主稿规划 8–10 分钟，未实际计时。
- [x] 将旧讲稿标注为 v2 快照，README 指向 v3。PPT v2 与其备注、内容 JSON 未同步重建，不声称升级了 PPT。
- [x] 核对英文模型原文、W1–W5 文档、实际 UI 标签与 CI。英文/UI run `37844817779`（`525769a`）已 success，取代旧讲稿的 pending 描述。其他提交状态继续变化，不能据此说所有上游检查已通过。

采用 Presentations 写作规范：用具体行为与证据说明亮点，保留 audience 必须知道的局限，避免把计划或成功运行包装成专家验证。当前讲稿保留假设性付费意愿问题的已知缺点。

## 核对与同步

- [x] 独立临时数据库的根测试：24 passed；不会往已清理的演示数据库写新项目。
- [x] 校验讲稿 10 页标题与 PPT 内容快照一致、文档内部链接存在、备份被 Git 忽略。
- [ ] 提交并推送私有仓库，再验证独立 clone fast-forward 与 SHA 一致。

这次升级没有新建 PR、邀请组员、发送邮件、调用付费 API 或放开本地监听范围。
