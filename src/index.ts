import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseHtml, uploadHtml } from './parser';
import { createNotionPage } from './notion';
import { processContentWithAI } from './gemini'; // 修改引入路径
import type { ClippedData, Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// 根路径和健康检查
app.get('/', (c) => {
  return c.json({
    message: 'Web-to-Notion API Service',
    version: '1.0.0',
    endpoints: {
      clip: 'POST /api/clip - Upload HTML content for processing'
    },
    status: 'running'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// HTML文件代理端点 - 让HTML文件可以直接在浏览器中打开
app.get('/view/:fileId', async (c) => {
  const fileId = c.req.param('fileId');

  if (!fileId) {
    return c.text('File ID is required', 400);
  }

  try {
    // 从图床获取HTML文件内容
    const imageHostUrl = `https://${c.env.TG_IMAGE_HOST}/file/${fileId}`;
    const response = await fetch(imageHostUrl);

    if (!response.ok) {
      return c.text('File not found', 404);
    }

    const htmlContent = await response.text();

    // 返回HTML内容，设置正确的Content-Type让浏览器直接显示
    return c.html(htmlContent);
  } catch (error: any) {
    return c.text(`Error loading file: ${error.message}`, 500);
  }
});

app.post('/api/clip', async (c) => {
  const html = await c.req.text();

  if (!html) {
    return c.json({ error: 'No HTML content provided' }, 400);
  }

  try {
    // 1. 解析HTML，获取主要文本内容和原始URL
    const parsedData = parseHtml(html);

    // 2. 调用AI处理，生成标题、摘要和标签
    const aiResponse = await processContentWithAI(parsedData.mainContent, c.env);

    // 3. (并行) 上传HTML文件快照
    let htmlUrl = '';
    try {
      htmlUrl = await uploadHtml(html, c.env);
      console.log('HTML upload successful:', htmlUrl);
    } catch (uploadError: any) {
      console.error('HTML upload failed:', uploadError.message);
      // HTML文件上传是必须的，如果失败则抛出错误
      throw new Error(`HTML文件上传失败: ${uploadError.message}`);
    }

    // 4. 验证HTML文件上传是否成功
    if (!htmlUrl || !htmlUrl.startsWith('http')) {
      throw new Error(`HTML文件上传失败，无法继续同步到Notion。上传结果: ${htmlUrl}`);
    }

    // 5. 组装最终写入Notion的数据
    const notionPageData: ClippedData = {
      title: aiResponse.title,
      originalUrl: parsedData.originalUrl || 'https://example.com', // 如果原始URL为空，则提供一个默认值
      summary: aiResponse.summary,
      tags: aiResponse.tags,
      htmlUrl,
    };

    // 5. 创建Notion页面
    const notionResponse = await createNotionPage({
        title: notionPageData.title,
        originalUrl: notionPageData.originalUrl,
        summary: notionPageData.summary,
        tags: notionPageData.tags.map(tag => ({ name: tag })),
        createdAt: new Date().toISOString(),
        htmlUrl: notionPageData.htmlUrl, // 添加缺失的htmlUrl字段
    }, c.env);

    return c.json({ success: true, notionResponse, parsedData: notionPageData });
  } catch (error: any) {
    return c.json({ error: error.message, stack: error.stack }, 500);
  }
});

export default app;
