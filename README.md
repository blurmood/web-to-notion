# Web-to-Notion

一个基于 Cloudflare Workers 的智能网页剪藏工具，使用 AI 分析网页内容并自动同步到 Notion 数据库。

## ✨ 功能特性

- 🤖 **AI 智能分析**: 使用 Google Gemini 1.5 Flash 智能生成标题、摘要和标签
- 📄 **HTML 解析**: 自动提取网页内容和原始链接
- 🗂️ **图床上传**: 将 HTML 文件上传到图床并生成可直接打开的链接
- 📝 **Notion 同步**: 自动创建结构化的 Notion 页面
- 📱 **iOS 快捷指令支持**: 一键从 Safari 或文件应用剪藏网页
- 🔐 **安全配置**: 使用 Cloudflare Workers Secrets 保护敏感信息

## 🏗️ 技术架构

- **运行环境**: Cloudflare Workers
- **开发语言**: TypeScript
- **Web 框架**: Hono
- **HTML 解析**: Cheerio
- **AI 服务**: Google Gemini API
- **存储服务**: Notion API + 图床服务

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/yourusername/web-to-notion.git
cd web-to-notion

# 安装依赖
npm install

# 安装 Wrangler CLI
npm install -g wrangler
```

### 2. 配置环境变量

```bash
# 设置 Notion Token
wrangler secret put NOTION_TOKEN

# 设置 Gemini API Key
wrangler secret put GEMINI_API_KEY
```

### 3. 配置 wrangler.toml

```toml
[vars]
TG_IMAGE_HOST = "your-image-host.workers.dev"
NOTION_DATABASE_ID = "your-notion-database-id"
```

### 4. 部署

```bash
npm run deploy
```

## 📱 iOS 快捷指令设置

### 简化版快捷指令（推荐）

1. **选择文件**
   - 操作：选择文件
   - 文件类型：任何

2. **发送到服务器**
   - 操作：获取URL内容
   - URL: `https://your-worker.workers.dev/api/clip`
   - 方法: POST
   - 标头: `Content-Type: text/html`
   - 请求正文: [来自"选择文件"的结果]
   - 允许不受信任的主机: ✅

3. **显示结果**
   - 操作：如果
   - 条件：success 等于 true
   - 成功：显示"✅ 同步成功"
   - 失败：显示"❌ 同步失败"

## 🔧 API 接口

### POST /api/clip

上传 HTML 内容进行处理

**请求头:**
```
Content-Type: text/html
```

**请求体:**
```html
<html>
  <head><title>页面标题</title></head>
  <body>页面内容</body>
</html>
```

**响应:**
```json
{
  "success": true,
  "notionResponse": {
    "id": "page-id",
    "url": "https://notion.so/page-url"
  },
  "parsedData": {
    "title": "AI生成的标题",
    "summary": "AI生成的摘要",
    "tags": ["标签1", "标签2"],
    "htmlUrl": "https://your-worker.workers.dev/view/file-id"
  }
}
```

## 🗂️ Notion 数据库结构

确保您的 Notion 数据库包含以下字段：

- **Title** (标题) - 标题类型
- **摘要** (富文本) - 富文本类型
- **原始链接** (URL) - URL 类型
- **Tags** (多选) - 多选类型
- **创建时间** (日期) - 日期类型
- **html文件** (URL) - URL 类型

## 🔐 安全配置

项目使用 Cloudflare Workers Secrets 存储敏感信息：

- `NOTION_TOKEN`: Notion 集成令牌
- `GEMINI_API_KEY`: Google AI API 密钥

这些密钥不会存储在代码仓库中，确保安全性。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请创建 Issue 或联系维护者。
