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

本地验收时发现，主 Demo 点击搜索后有时会长时间停留在加载状态；搜索页下方的推荐搜索/相关搜索也存在点击反馈不稳定的问题。进一步排查后，主要原因有三类：

1. 前端在提交搜索后同时请求 `/api/search` 和 `/api/overview`。其中 AI Overview 是 SSE 流式接口，后端也会再次执行检索。冷启动或 CPU 较慢时，两类请求叠加，用户会感觉搜索结果“卡住”。
2. 本地 Windows + WSL 环境下，`localhost`、`127.0.0.1`、Next.js dev server 的访问源限制会影响浏览器资源加载，导致页面表现不稳定。
3. 搜索建议和推荐按钮需要明确声明为普通按钮，并在点击时避免失焦逻辑吞掉事件。

解决方案：

- 将前端逻辑调整为“先返回搜索结果，再启动 AI Overview”，保证用户先看到结果卡片。
- 为 `/api/search` 和 `/api/suggest` 增加超时控制，失败时显示明确错误提示，而不是一直 loading。
- 为 SSE AI Overview 增加超时和关闭逻辑，避免流式连接异常时界面无法恢复。
- 后端增加查询向量缓存，减少重复搜索时的 embedding 计算开销。
- 将本地默认 API 地址改为 `http://127.0.0.1:8000`，减少 Windows/WSL 下 `localhost` 解析差异。
- 在 Next.js 配置中允许 `127.0.0.1` dev origin，避免开发模式下资源请求被拦截。
- 给推荐搜索和搜索建议按钮补充 `type="button"` 以及点击保护逻辑，确保点击后能稳定触发搜索。
- widget 和 inline 页面同步增加请求超时、AI Overview 延后启动、错误提示和本地地址修正。

修复后重新验证：

- 主 Demo 搜索可以正常返回结果。
- 推荐搜索和相关搜索可以点击并发起新查询。
- widget 预览页和 inline 预览页可以正常打开。
- 后端搜索接口在模型加载完成后保持秒级响应。

## 7. 本地运行方式

后端：

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev -- -H 0.0.0.0 -p 3000
```

widget 预览：

```bash
cd widget
npm install
npm run build
python3 -m http.server 8010 --bind 0.0.0.0
```

本地访问：

- 主 Demo：`http://localhost:3000/?q=ginseng%20quality%20testing`
- 后端健康检查：`http://localhost:8000/api/health`
- 浮动 widget 预览：`http://localhost:8010/`
- inline 页面预览：`http://localhost:8010/inline.html?q=ginseng%20quality%20testing`

## 8. 验证情况

已完成以下验证：

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd widget && npm run build
cd widget && node --check dist/ai-search-widget.js dist/ai-search-inline.js dist/ai-search-bridge.js
cd backend && python -m compileall app
```

运行验证：

- `/api/health` 正常返回。
- `/api/search?q=ginseng quality testing` 返回相关结果。
- 无效查询返回空结果而不是大量无关结果。
- 主 Demo、浮动 widget 预览、inline 页面均可在本地访问。

## 9. 部署说明

仓库包含 `deploy/`、Dockerfile、Caddyfile 和 `DEPLOY.md`，可部署到支持 Docker 的服务器上，并通过 HTTPS 对外提供：

- Next.js Demo 页面。
- FastAPI 搜索 API。
- widget / bridge / inline 三个嵌入脚本。

GitHub Pages 只能托管静态页面，不能运行 FastAPI 后端、模型索引和 SSE 流式接口。因此完整 Demo 需要部署到 VPS、Render、Railway、Fly.io 等支持后端服务的平台。
