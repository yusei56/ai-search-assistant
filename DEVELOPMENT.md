# 开发文档

## 1. 项目目标

本项目为测试站点 `https://test-site.141154.cd-web.org/` 实现一个 AI 搜索助理 Demo，参考示例网站 `https://www.ptglab.com/results?q=cd` 的搜索体验，提供搜索输入、AI Overview、结构化结果、分类筛选和站点嵌入能力。

项目仓库：

https://github.com/yusei56/ai-search-assistant

## 2. 设计思路

整体采用前后端分离 + RAG 检索增强生成架构。

主要模块：

| 模块 | 说明 |
| --- | --- |
| `backend/` | FastAPI 后端，负责站点内容索引、混合检索、搜索建议和 AI Overview 流式输出。 |
| `frontend/` | Next.js 独立 Demo 页面，展示完整搜索体验。 |
| `widget/` | 可嵌入测试站点或 WordPress 的浏览器脚本。 |

搜索链路：

1. 通过 WordPress REST API 获取测试站内容。
2. 清洗页面 HTML，并切分为可检索文本块。
3. 构建离线索引，包括 BM25 关键词索引和向量 embedding。
4. 用户搜索时执行 BM25 + 向量检索，并使用 RRF 融合排序。
5. 返回结构化结果卡片、分类 facets、摘要 snippet 和来源上下文。
6. 可选调用 OpenAI-compatible LLM，基于检索结果生成带引用的 AI Overview。

为了方便验收，仓库中保留了小体积离线索引文件，clone 后可以直接运行搜索 Demo，不必立即重新抓站建索引。

## 3. 主要功能

- 搜索框关键词输入。
- 相关搜索建议和推荐搜索。
- 高相关性结果卡片。
- 分类筛选 facets。
- Load more 分页加载。
- AI Overview，支持来源 chips 和引用标注。
- 无结果兜底，避免无关查询返回大量弱相关页面。
- 浮动 widget，可快速嵌入原站。
- bridge 脚本，可接管原站搜索框。
- inline 脚本，可创建 `/ai-search/` 独立搜索页。

## 4. 测试站点嵌入方式

项目支持三种嵌入方式。

### 方案 A：浮动 AI 搜索按钮

适合快速演示，不改原站搜索框。

```html
<script
  src="https://YOUR_DEPLOYED_DOMAIN/ai-search-widget.js"
  data-api-base="https://YOUR_DEPLOYED_DOMAIN"
  data-title="AI Search"
></script>
```

页面右下角会出现 AI Search 按钮，点击后打开侧边搜索面板。

### 方案 B：接管原站搜索框

适合证明可以适配测试站原搜索入口。

```html
<script
  src="https://YOUR_DEPLOYED_DOMAIN/ai-search-widget.js"
  data-api-base="https://YOUR_DEPLOYED_DOMAIN"
  data-title="AI Search"
></script>

<script
  src="https://YOUR_DEPLOYED_DOMAIN/ai-search-bridge.js"
  data-ai-search-bridge
></script>
```

用户提交原站搜索框时，bridge 会阻止默认 WordPress 搜索，并打开 AI 搜索面板执行查询。

### 方案 C：新增 `/ai-search/` 独立搜索页

适合更正式的站内 AI 搜索页。

```html
<div id="ai-search-root"></div>

<script
  src="https://YOUR_DEPLOYED_DOMAIN/ai-search-inline.js"
  data-api-base="https://YOUR_DEPLOYED_DOMAIN"
  data-target="#ai-search-root"
  data-title="AI Search"
></script>
```

再在全站加载 bridge，将原搜索框导向该页面：

```html
<script
  src="https://YOUR_DEPLOYED_DOMAIN/ai-search-bridge.js"
  data-ai-search-bridge
  data-mode="page"
  data-search-page="/ai-search/"
></script>
```

提交搜索后会跳转到 `/ai-search/?q=关键词`，并展示完整 AI 搜索结果。

## 5. AI 工具使用情况

开发过程中使用了 VS Code 环境下的 Codex 和 GitHub Copilot 作为 AI 编程辅助工具，帮助完成需求分析、前后端功能实现、搜索逻辑优化、嵌入脚本开发、问题排查和文档整理。

其中：

- Codex 主要用于整体方案设计、代码审查、功能补全、问题定位和调试。
- GitHub Copilot 主要用于前后端代码编写、组件实现和局部逻辑补全。

所有关键功能均经过人工检查、本地运行、构建测试和接口验证后提交。

## 6. 遇到的问题及解决方案

### 问题 1：错误查询仍返回弱相关结果

早期版本对 dense 检索和 BM25 检索结果直接融合，没有最低相关性阈值。类似 `zzzznotfoundtermzzzz` 的无效查询也会返回 Cookie Policy、促销页等弱相关内容。

解决方案：

- 增加关键词命中和语义相似度过滤。
- 对无有效命中的查询返回空结果。
- 前端增加无结果提示。

### 问题 2：独立 Demo 与测试站原页面集成不够直接

最初的 Next.js Demo 是独立搜索页，不能直接说明如何接入测试站原搜索框。

解决方案：

- 新增 `ai-search-widget.js`，支持浮动面板快速嵌入。
- 新增 `ai-search-bridge.js`，支持接管原站搜索框。
- 新增 `ai-search-inline.js`，支持 WordPress `/ai-search/` 独立页面。

### 问题 3：widget 功能弱于主 Demo

早期 widget 只展示基础搜索结果，缺少 AI Overview、分类筛选、来源 chips 和 Load more。

解决方案：

- 升级 widget，补齐 AI Overview、sources、facets、缩略图和 Load more。
- 暴露 `window.AISearchAssistant.open/search/close`，方便 bridge 调用。

### 问题 4：本地搜索体验偶尔卡住

