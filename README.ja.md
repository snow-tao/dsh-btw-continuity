# DSH BTW Continuity

DeepSeek Harness で継続的にサイド質問を行うプラグインです。1 セッションにつき 1 つのパネルに会話を表示し、メインタスクを中断せずに追加質問できます。

[简体中文](README.zh-CN.md) · [English](README.en.md) · 日本語 · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity は [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw) の独立した変更版**で、Apache-2.0 により提供されます。DeepSeek AI または MichengAI の公式製品ではありません。出典と変更内容は [NOTICE.md](NOTICE.md) を参照してください。

## 機能

- セッション内の全 BTW 問答を時系列の単一パネルに表示。
- パネル下部から直接追加質問。Enter で送信、Shift+Enter で改行。
- 入力欄は 1 行から最大 4 行まで自動拡張し、超過分は内部スクロール。送信後は 1 行に戻ります。
- X はパネルを隠すだけで、次の質問時に履歴を復元。
- ゴミ箱アイコンで現在のセッションの BTW 履歴を消去して再開始。
- 回答はデフォルトでメイン会話に書き込まれず、明示された場合のみ `send_message` で返送。
- デフォルトは読み取り専用の回答。選択テキストへの質問、Markdown、数式、コピー、8 言語に対応。

## 現在の画面

![BTW Continuity の単一パネル、履歴、下部の追加質問入力欄](assets/screenshots/btw-continuity-panel.webp)

## 前提条件

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- 設定済みのモデルプロバイダー

**`@michengai/dsh-btw` と同時にインストールまたは有効化しないでください**。両方が `/btw` を登録します。

## インストール

`desktop` は実際のプロファイル名に置き換えてください。

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

自動で有効にならない場合は、デスクトップアプリを再読み込みするか DSH サービスを再起動してください。

## 使い方

```text
/btw 現在の案を一文で要約して
```

`/` メニューから `btw` を選択するか、本文を選択して「サイド質問」を使うこともできます。

パネルを展開し、下部の入力欄から追加質問してください。パネル内の質問と `/btw` は同じ履歴を共有します。

| 操作 | 動作 |
| --- | --- |
| X | 履歴を消さずにパネルを隠し、次の質問で復元します。 |
| ゴミ箱 | このセッションの BTW 履歴をすべて消去し、新しく開始します。 |
| コピー | 対応する回答の Markdown をコピーします。 |

## 履歴とプライバシー

- 後続のリクエストには、完了した BTW 問答と質問時点のメイン会話のコンテキストが含まれるため、トークン使用量が増える場合があります。
- 送信先は設定済みのモデルプロバイダーのみで、新しい第三者の送信先は追加されません。
- 履歴は Host メモリに保存され、Host の再起動で失われます。必要な回答はコピーして保存してください。

## 設定

**プラグイン → BTW Continuity → 設定** で、`send_message` 以外に許可するツール（1 行に 1 件）とカスタムプロンプトを変更できます。デフォルトはテキストのみの回答です。

## アンインストール

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## 開発

```bash
npm ci --ignore-scripts
npm run check
```

## ライセンス

[Apache-2.0](LICENSE) · [出典と変更内容](NOTICE.md)
