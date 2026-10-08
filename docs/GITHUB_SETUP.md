# GitHub 仓库与组员访问

更新日期：2026-10-08。

## 仓库信息

| 项目 | 值 |
| --- | --- |
| 仓库 | [mingzhi0119/Virtual-EIR-Capstone](https://github.com/mingzhi0119/Virtual-EIR-Capstone) |
| 所有者 | mingzhi0119 |
| 可见性 | Private |
| 主分支 | main |
| 本地目录 | E:\MS_Apply\Offer\MSAIB UR\Capstone |
| HTTPS remote | https://github.com/mingzhi0119/Virtual-EIR-Capstone.git |
| 协作方式 | 分支 → Pull Request → 评审 → 合并 |

## 组员状态

| 账号 | 角色/状态 |
| --- | --- |
| mingzhi0119 | 仓库所有者 |
| 其他组员 | 按 2026-10-08 安排暂不邀请，最早下周再讨论；未发出邀请 |

第一周启动工作由 Mingzhi 全权负责。下周是否邀请及邀请哪些账号，以届时安排为准，不自动发送邀请。

同一人的多台设备使用其自己的 GitHub 账号认证即可，无需按设备邀请。

## 邀请方式

所有者进入 [Settings → Collaborators](https://github.com/mingzhi0119/Virtual-EIR-Capstone/settings/access)，选择 Add people，输入组员 GitHub 用户名并邀请。组员接受后获得私有仓库协作访问，可以推送分支和创建 PR。

组员使用自己的提交身份，贡献合并到主分支后 GitHub 才可能在 Contributors 中显示；显示可能存在延迟，邮箱也应与 GitHub 账号关联。

邀请状态分为“未邀请”“待接受”“已接受”。只有“已接受”并完成访问验证，才登记为可用协作者。

## 已加入的协作配置

- `.gitignore`：排除本地密钥、环境文件、依赖、数据库、运行数据和缓存。
- `.gitattributes`：规范跨 Windows/macOS/Linux 的文本换行。
- `CONTRIBUTING.md`：新设备 clone、每日同步、分支/PR、换设备继续工作。
- `.github/pull_request_template.md`：记录任务、变更及验证。

没有配置付费能力、强制评审规则或 CI；以后有实际代码和验证命令时再补充。

## 初始同步验证

仓库初始化后核对：

1. `git remote -v` 指向上表仓库。
2. `git status --short --branch` 显示 main 跟踪 origin/main 且没有未提交改动。
3. `git rev-parse HEAD` 与 `git ls-remote origin refs/heads/main` 一致。
4. 在独立临时目录 clone 后，文档和配置文件完整。

当前仓库是 Capstone 文档和未来增量实现的共享位置。GOAT AI 原仓库继续作为既有平台来源；正式导入或改造代码时记录基线和 Capstone 增量。
