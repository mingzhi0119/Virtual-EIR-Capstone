# 第一周例会材料

成果日期：2026-10-08；不是对正式会议时间的确认。

当前演讲稿：[Speaker-Script-v3.md](Speaker-Script-v3.md)。按原 10 页顺序补充英文主讲、可选细节、90–120 秒现场操作台词、五项有证据的亮点、11 组备问及约五分钟短版。主讲加演示规划约 8–10 分钟，必须实际计时。模型输出本身为英文，不再依赖中文翻译。

`v2.pptx`、`Speaker-Script.md` 的正文及内容 JSON 保留为历史快照；PPT 和其中的 Speaker Notes **没有同步升级**。现场以 v3 讲稿及当前 `docs/LOCAL_RUN.md` 为准，不沿用旧备注中的“中文输出英文意译”或“远程 CI pending”。英文/UI 提交的 CI run 37844817779 已通过，之后提交的状态另行核对。

- `Virtual-EIR-Week1-v2.pptx`：英文、可编辑，8 页主讲 + 2 页技术/演示备问；每页含英文 Speaker Notes 和来源。
- `Speaker-Script-v3.md`：当前增强版英文讲稿与中文操作提示。
- `Speaker-Script.md`：旧版讲稿快照，开头指向当前 v3。
- `Slide-Content.json`：可检查的页面内容、讲稿和来源快照。

所有案例和访谈均为虚构；不声称已做真实学生访谈、专家认可、正式上线或安全就绪。备用回放引用真实的本地英文模型记录，不冒充直播。当前 Venture 列表已清理，只保留英文演示项目及其两次会话，备份位置见实施归档。

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

脚本仍以 v2 内容为基础，同时重写 `Speaker-Script.md` 和 `Slide-Content.json`，**不会自动把 v3 新讲稿写入 PPT 备注**，也不写 `Speaker-Script-v3.md`。要做新版 PPT，先将 v3 内容同步到构建源并保留旧文件，再生成新版本。构建检查、渲染图片和旧草稿保存在被 Git 忽略的 `var/presentation-build-20261008`。这些材料不包含真实创业者资料。
