# 第一周例会材料

成果日期：2026-10-08；不是对正式会议时间的确认。

后续英文实机更新：应用已改为英文资料、输入和回复，界面与 GOAT 统一；现场操作以最新 `docs/LOCAL_RUN.md` 为准。`v2.pptx`、讲稿和内容 JSON 保留为当时的汇报快照，没有伪装成已重新生成。其“中文输出英文意译”及“远程 CI pending”描述属于旧快照；当前英文原文见 `docs/archive/2026-10-08-english-demo.json`，基线远程 CI 已通过，最新状态见实施归档。新版产品演示不再依赖翻译中文聊天。

- `Virtual-EIR-Week1-v2.pptx`：英文、可编辑，8 页主讲 + 2 页技术/演示备问；每页含英文 Speaker Notes 和来源。
- `Speaker-Script.md`：英文逐页讲稿、中文提示、60–90 秒现场演示、录制结果备用讲法与简短问答。
- `Slide-Content.json`：可检查的页面内容、讲稿和来源快照。

建议安排约 6–7 分钟，须实际排练。虚构案例和中文模型输出的英文意译均明确标注；不声称已做真实学生访谈、专家认可、正式上线或安全就绪。演示备份引用已归档的真实本地模型运行，不冒充直播。

## 使用前

1. 在自己的 PowerPoint 中打开 PPT，检查字体、备注和放映。本轮已做包结构、布局、字体、可编辑表格及重新导入渲染检查，未在原生 PowerPoint 中放映。
2. 按 `docs/LOCAL_RUN.md` 启动本地服务，打开已保存的虚构项目，核对计划 5 次、完成 2 次访谈。
3. 从第 5 页切到浏览器，新建会话，不粘贴旧对话；如服务异常，明确说明使用录制的 10 月 8 日测试结果。
4. GitHub CI 状态会继续变化；以根目录归档与 PR 页面为准。上游 PR #28/#29 尚未合并，原有 lint/依赖门禁未解除。

## 修改与重建

日常可直接编辑 PPT；自动重建时修改仓库的 `tools/presentations/build-week1.mjs`，然后生成新版本，避免覆盖已交付文件。脚本需要 Codex 随附的 Artifact Tool/Presentations 运行时，不是只装 Node 就能运行；路径因设备而异。

```powershell
$env:SKILL_DIR = '<Presentations skill 的绝对路径>'
$env:RUNTIME_NODE_MODULES = '<随附 Node runtime 的 node_modules 绝对路径>'
$env:RUNTIME_PYTHON = '<随附 Python 可执行文件绝对路径>'
$env:DECK_FILENAME = 'Virtual-EIR-Week1-v3.pptx'
node tools/presentations/build-week1.mjs
```

脚本同时更新内容快照和讲稿；先提交手工修改再重建，避免丢失直接编辑的内容。构建检查、渲染图片和旧草稿保存在被 Git 忽略的 `var/presentation-build-20261008`。这些材料不包含真实创业者资料。
