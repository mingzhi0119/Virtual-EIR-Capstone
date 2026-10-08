# 团队协作与跨设备同步

本项目以 GitHub 仓库为共享来源，日常工作使用个人分支和 Pull Request。

## 1. 在新设备开始

安装 Git；私有仓库需要登录具有访问权限的 GitHub 账号。可使用 GitHub CLI、Git Credential Manager 或 GitHub Desktop 登录。

```bash
gh auth login
gh repo clone mingzhi0119/Virtual-EIR-Capstone
cd Virtual-EIR-Capstone
git status
```

也可在已配置 GitHub HTTPS 身份验证的设备使用：

```bash
git clone https://github.com/mingzhi0119/Virtual-EIR-Capstone.git
```

每台设备使用自己的 Git 提交身份；不要把其他组员姓名或邮箱设为自己的身份。可在本仓库配置（替换占位值）：

```bash
git config user.name "Your Name"
git config user.email "Your GitHub email or noreply email"
```

## 2. 开始一项工作

先确认没有未提交改动，再同步 main 并创建任务分支：

```bash
git status
git switch main
git pull --ff-only
git switch -c docs/your-name-user-journey
```

分支示例：`docs/name-profile`、`feat/name-venture-memory`、`fix/name-session-restore`。一个分支围绕一个任务，便于评审。

## 3. 保存并共享

```bash
git diff
git add docs/PROTOTYPE_BRIEF.md
git diff --cached
git commit -m "docs: refine entrepreneur profile"
git push -u origin HEAD
gh pr create --base main
```

`git add` 使用实际修改路径。提交前检查内容；PR 描述写明改变了什么、对应本周哪个任务、如何验证。完成评审后合并，任务状态在 WEEKLY_DELIVERABLES.md 更新。

本流程是团队约定；目前未设置强制分支保护，仓库设置不会自动阻止直接推送 main。

## 4. 换设备继续同一分支

离开设备 A 前 commit 并 push。首次在设备 B 使用该分支：

```bash
git fetch origin
git switch --track origin/docs/your-name-user-journey
```

若本地已存在该分支：

```bash
git switch docs/your-name-user-journey
git pull --ff-only
```

如果同一分支两台设备都已有新提交，`--ff-only` 会停止，先检查 `git status` 和分支差异再解决；不要用强制推送覆盖另一台设备或组员的工作。

## 5. 同步范围

Git 同步已经 commit 且 push 的文件。未提交文件、环境变量、API key、依赖安装、运行数据库和被 .gitignore 忽略的文件不会自动同步。

当前共享完整 GOAT 源码基线（`apps/goat`）、Capstone EIR 层（`eir`）、文档、测试和虚构运行证据。新设备安装与启动见 [LOCAL_RUN.md](docs/LOCAL_RUN.md)。`var` 中的数据库、模型与依赖不能通过 Git 恢复，需单独备份；真实资料使用获准的安全渠道。

## 6. 添加组员

Collaborator 是访问权限；Contributor 是 GitHub 根据贡献记录展示的身份。添加组员须邀请其 GitHub 账号，接受后才能访问这个私有仓库。

邀请和权限管理见 [GitHub 设置说明](docs/GITHUB_SETUP.md)。需要组员 GitHub 用户名；姓名和 GitHub display name 不足以准确邀请。
