# DSH BTW Continuity

在 DeepSeek Harness 当前会话中连续旁问：单面板保留问答记录，底部直接追问，不打断主任务。

[English](README.en.md) · 简体中文 · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity 是基于 [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw) 的独立修改版**，遵循 Apache-2.0，并非 DeepSeek AI 或 MichengAI 官方产品。来源、版权和修改说明见 [NOTICE.md](NOTICE.md)。

## 功能

- **同一 session 连续对话**：所有 BTW 问答按时间顺序显示在一个面板中。
- **底部直接追问**：展开面板即可输入；Enter 发送，Shift+Enter 换行。
- **自适应输入框**：默认单行，随内容最多扩展至四行，超出后内部滚动；发送后恢复单行。
- **隐藏与恢复**：X 只隐藏面板，下一次提问自动恢复可见历史。
- **显式清空**：点击垃圾桶清空当前 session 的 BTW 历史并重新开始。
- **保持主任务隔离**：答案默认不进入主会话；只有明确要求回传时才使用 `send_message`。
- **只读回答**：默认不读取新文件、联网、运行命令或修改代码；可选工具白名单仍受限制。
- **划词旁问与多语言**：支持正文划词提问、Markdown、公式、复制，以及 8 门界面语言。

## 当前界面

![BTW Continuity 单面板连续对话、历史记录与底部追问输入框](assets/screenshots/btw-continuity-panel.webp)

## 前置条件

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- 已配置可用的模型服务

**不要与原插件 `@michengai/dsh-btw` 同时安装或启用**，两者都会注册 `/btw`。

## 安装

将 `desktop` 替换为你的实际 profile：

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

如果未自动生效，请重新加载桌面应用或重启对应 DSH 服务；仅刷新浏览器可能不足以加载新的 Host 代码。

## 使用

### 开启或追加旁问

```text
/btw 用一句话总结刚才的方案
```

也可以从 `/` 指令菜单选择 `btw`，或在会话正文中划词后选择「旁问」。

### 在面板中追问

展开 BTW 面板，在底部独立输入框直接提问：

- **Enter**：发送；
- **Shift+Enter**：换行；
- 输入框默认单行，最多自动扩展到四行；
- 面板内追问与再次使用 `/btw` 共享同一份历史。

### 隐藏、恢复和清空

| 操作 | 行为 |
| --- | --- |
| X | 隐藏整个 BTW 面板，不清除历史；下一次提问恢复。 |
| 垃圾桶 | 清空当前 session 的全部 BTW 历史并移除面板；下一次提问从头开始。 |
| 复制 | 复制对应回答的原始 Markdown。 |

### 历史与隐私

- 后续请求会继承此前已完成的 BTW 问答以及提问时的主会话上下文，因此可能增加 token 消耗。
- 请求仍只发往当前配置的模型服务，不新增第三方接收方。
- BTW 历史保存在 Host 内存中，Host 重启后会丢失；需要长期保存的答案请先复制。
- 刷新页面后可从 Host 历史恢复面板。正在生成的回答不计入已完成历史。

## 配置

在 **插件 → BTW Continuity → 配置** 中可调整：

| 配置项 | 作用 |
| --- | --- |
| 放行工具 | 除 `send_message` 外允许使用的工具名，每行一个。默认仅文字回答。 |
| 自定义提示词 | 替换内置旁问提示词；工具权限说明仍会追加。 |

## 卸载

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## 本地开发

```bash
npm ci --ignore-scripts
npm run check
```

`npm run check` 执行类型检查、测试、发布检查和构建。开发与构建基线为 DSH `0.2.2-rc.2`。

## 许可证

[Apache-2.0](LICENSE) · [来源与修改说明](NOTICE.md)
