# Ever Traduora 平台

**简体中文** | [English](README.md)

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/ever-co/ever-traduora)
[![Latest Release](https://img.shields.io/github/release/ever-co/ever-traduora.svg?label=latest%20release)](https://github.com/ever-co/ever-traduora/releases)
[![GitHub License](https://img.shields.io/badge/license-AGPL-v3.svg)](https://raw.githubusercontent.com/ever-co/ever-traduora/master/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/traduora/traduora)](https://hub.docker.com/r/traduora/traduora)
[![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/evereq?utm_source=github&utm_medium=button&utm_term=evereq&utm_campaign=github)

## 💡 最新动态

- 🔥🔥🔥 我们刚刚发布了 [Ever Works](https://github.com/ever-works/ever-works)：一个开放的智能体运行时，可全天候自主调研、交付并运营整个业务。欢迎前往 <https://github.com/ever-works/ever-works> 体验，并为它点亮 ⭐⭐⭐！
- 如果你喜欢 Ever Traduora，也欢迎了解 [Ever Gauzy](https://github.com/ever-co/ever-gauzy)：开放的业务管理平台（ERP/CRM/HRM/ATS/PM）。请访问 <https://github.com/ever-co/ever-gauzy> 并点亮 ⭐！

## 🌟 项目简介

[Ever® Traduora](https://traduora.co) 是面向团队的**开源翻译管理平台**。

创建项目后，你可以导入和导出多种格式的翻译内容，与团队成员协作，通过 OTA 方式即时发布翻译更新，并且（_即将支持_）通过第三方集成自动翻译你的项目。

![Traduora 产品截图](docs-website/static/img/traduora-preview.png)

我们希望 Traduora 成为管理翻译工作流的首选之地，因此将所有核心产品**开源**，旨在发展**社区**，并让开发者能够在此平台之上进行构建。

我们也会在其他开源平台（目前包括 https://github.com/ever-co/ever-gauzy 和 https://github.com/ever-co/ever-demand）中使用 Traduora。欢迎访问我们的官方网站 https://ever.co 了解更多平台信息。

## ✨ 功能特性

如需快速了解功能，请查看官方文档的[截图](https://docs.traduora.co/docs/screenshots)页面。

平台功能简要列表：

- 5 分钟完成部署：支持 Docker、Kubernetes 或源码方式
- 即时搜索，快速找到所需内容
- 邀请团队成员，大家可在同一项目中协同工作
- 通过 REST API 自动化翻译工作流
- 支持导入和导出常用格式：JSON（扁平和嵌套）、CSV、YAML（扁平和嵌套）、Java Properties、XLIFF 1.2、Gettext (po)、Strings、Android Resources (xml)
- 社区贡献的 CLI 工具：https://github.com/iilei/traduora-cli（非官方 CLI）

更多信息请访问官方网站 [traduora.co](https://traduora.co) 或文档站点 [docs.traduora.co](https://docs.traduora.co)。

想要的功能还没有？欢迎提交 [issue](https://github.com/ever-co/feature-requests/issues) 告诉我们。

## 📄 文档

请参阅官方[平台文档](https://docs.traduora.co)。

## 📊 活跃度

![Alt](https://repobeats.axiom.co/api/embed/8ed434d797f3fafdb41858386930efa788949773.svg 'Repobeats analytics image')

## 🚀 快速体验

Traduora 几乎可以在任何地方运行，详见[快速开始](https://docs.traduora.co/docs/getting-started)。

你也可以访问 Traduora 的 [Docker Hub 页面](https://hub.docker.com/r/everco/ever-traduora) 获取预构建镜像。

### 配置

请查看[配置文档](https://docs.traduora.co/docs/configuration)。

### 部署

有关部署 Traduora 的更多信息，请查看[部署文档](https://docs.traduora.co/docs/deployment)。

[![Deploy on Elestio](https://elest.io/images/logos/deploy-to-elestio-btn.png)](https://elest.io/open-source/traduora)

### 👤 默认管理员用户

当禁用用户注册（`TR_SIGNUPS_ENABLED=false`）时，需要一个默认管理员用户才能访问平台。

Traduora 提供了用于创建该默认管理员用户的 seed 功能。你可以用它登录并执行管理操作，例如邀请其他用户。

只有在你通过以下环境变量设置了密码后，才会创建管理员用户：

- `TR_ADMIN_EMAIL` – 管理员邮箱（默认值：`local.admin@ever.co`）
- `TR_ADMIN_PASSWORD` – 管理员密码（**必填**，无默认值；
  例如可使用 `openssl rand -base64 24` 的输出）。公开已知的密码（例如旧的默认密码）会被拒绝。
- `TR_ADMIN_NAME` – 管理员用户名（默认值：`Admin`）

> 🔐 首次登录后，你可以在 Web 界面的用户设置中修改这些管理员凭据（邮箱、密码、名称）。
>
> ⚠️ 0.21.0 和 0.22.0 版本创建该用户时使用了本 README 中公开的默认密码。自 0.23.0 起，该密码不再能够登录：
> 使用它的首次登录尝试会失败，并将该密码从账户中移除。
> 如需设置新密码，请使用“忘记密码”功能。若无法发送邮件：请先用旧密码尝试登录一次（登录会失败，旧密码随即被移除），
> 然后设置 `TR_ADMIN_PASSWORD` 并重启 Traduora（保持 `TR_SEED_DATA` 为 `true`），即可为管理员用户设置该密码。
>
> 在你升级之前，任何人都可以使用该密码登录。请修改 `TR_SECRET` 以终止所有现有会话（所有人需要重新登录），
> 并检查该管理员用户所属项目的成员和 API 客户端。

**⚙️ Seed 选项：**

手动 seed 默认管理员用户：

```bash
# 在 monorepo 根目录
pnpm seed:default

# 或在 API 包目录
pnpm seed:default
```

运行所有 seed（包括默认管理员用户和其他演示数据）：

```bash
# 在 monorepo 根目录
pnpm seed

# 或在 API 包目录
pnpm seed
```

**🚀 启动时自动 Seed：**
如果设置了环境变量 `TR_SEED_DATA=true`（默认值），Traduora 会在应用启动时自动运行 seed 脚本。
当 `TR_ADMIN_PASSWORD` 被设置为不公开的密码时，这可以确保默认管理员用户无需任何手动操作即可使用。

## 🔗 常见问题

有些问题经常被问到，请先查看我们的 [FAQ](https://docs.traduora.co/docs/faq)！

## 💌 联系我们

- [Ever.co 官网联系页面](https://ever.co/contacts)
- [Discord 聊天](https://discord.gg/msqRJ4w)
- [CodeMentor](https://www.codementor.io/evereq)
- 商务咨询：<mailto:traduora@ever.co>
- 请将安全漏洞报告发送至 <mailto:security@ever.co>

## 🔐 安全

安全对我们非常重要。
Ever® Traduora 平台遵循良好的安全实践，但任何软件都无法保证 100% 安全！
Ever® Traduora 平台按“现状”提供，不附带任何担保，使用风险自负！
更多详情请参阅 [LICENSE](https://github.com/ever-co/ever-traduora/blob/master/LICENSE)。

在生产环境中，所有客户端到服务端（后端、API）的通信都应使用 HTTPS/SSL 加密（REST API）。

如果你发现任何安全问题，请通过邮件 <mailto:security@ever.co> 负责任地向我们披露，而不要创建 GitHub issue。

## 国际化

当然，我们希望 Traduora 支持尽可能多的语言，欢迎你参与贡献！

## 更新日志

有关版本发布信息，请查看[更新日志](https://docs.traduora.co/docs/changelog)。

## 🛡️ 许可证

请参阅 [LICENSE](https://github.com/ever-co/ever-traduora/blob/master/LICENSE)。

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fever-co%2Fever-traduora.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fever-co%2Fever-traduora?ref=badge_large)

Traduora 由 https://github.com/anthonynsimon（https://anthonynsimon.com）和[贡献者们](https://github.com/ever-co/ever-traduora/graphs/contributors)创建。2021 年 4 月，项目转交 [Ever](https://ever.co) 公司继续开发。

## ™️ 商标

**Ever**® 是 [Ever Co. LTD](https://ever.co) 的注册商标。  
**Ever® Traduora™**、**Ever® Demand™**、**Ever® Gauzy™**、**Ever® Teams™** 和 **Ever® OpenSaaS™** 均为 [Ever Co. LTD](https://ever.co) 的商标。
未经 Ever Co. LTD. 书面许可，不得使用这些商标，也不得用其推广或营销竞争性产品或服务。

所有其他品牌和产品名称均为其各自持有者的商标、注册商标或服务标记。

## 🍺 参与贡献

很高兴你愿意为 Traduora 做出贡献。

- 请在 GitHub 上给我们点个 :star:，这很有**帮助**！
- 欢迎在[独立仓库](https://github.com/ever-co/feature-requests/issues)中提交功能需求。
- 欢迎提交 Pull Request！请基于 _develop_ 分支，并遵循[贡献指南](https://docs.traduora.co/docs/contributing)。

## 💪 感谢贡献者

贡献者名单请见 [CONTRIBUTORS.md](https://github.com/ever-co/ever-traduora/blob/develop/.github/CONTRIBUTORS.md)。  
你也可以查看 [GitHub 统计的完整贡献者列表](https://github.com/ever-co/ever-traduora/graphs/contributors)。

<img src="https://contributors-img.web.app/image?repo=ever-co/ever-traduora" />

## ⭐ Star 历史

[![Star History Chart](https://stats-github.ever.co/svg?repos=ever-co/ever-traduora&type=Date)](https://stats-github.ever.co/#ever-co/ever-traduora&Date)

## ❤️ 技术支持

<p>
  <a href="https://www.digitalocean.com/?utm_medium=opensource&utm_source=ever-co">
    <img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_blue.svg" width="201px">
  </a>
</p>

---

![visitors](https://visitor-badge.laobi.icu/badge?page_id=ever-co.traduora-platform)
[![Circle CI](https://circleci.com/gh/ever-co/ever-traduora.svg?style=svg)](https://circleci.com/gh/ever-co/ever-traduora)
[![codecov](https://codecov.io/gh/ever-co/ever-traduora/branch/master/graph/badge.svg)](https://codecov.io/gh/ever-co/ever-traduora)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/0d5e1c68dc1e44c79249241b4abb15b8)](https://www.codacy.com/gh/ever-co/ever-traduora/dashboard?utm_source=github.com&utm_medium=referral&utm_content=ever-co/ever-traduora&utm_campaign=Badge_Grade)
[![DeepScan grade](https://deepscan.io/api/teams/3293/projects/16761/branches/365112/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3293&pid=16761&bid=365112)
[![Known Vulnerabilities](https://snyk.io/test/github/ever-co/ever-traduora/badge.svg)](https://snyk.io/test/github/ever-co/ever-traduora)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fever-co%2Fever-traduora.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fever-co%2Fever-traduora?ref=badge_shield)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/ever-co/ever-traduora?utm_source=oss&utm_medium=github&utm_campaign=ever-co%2Fever-traduora&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
