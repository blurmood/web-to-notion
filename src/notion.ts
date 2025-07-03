import type { NotionPage } from './types';

export async function createNotionPage(data: NotionPage, env: any) {
  // 直接使用 fetch API 调用 Notion API，避免客户端库的兼容性问题
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      parent: { database_id: env.NOTION_DATABASE_ID },
      properties: {
        'Title': {
          title: [
            {
              text: {
                content: data.title,
              },
            },
          ],
        },
        // '摘要' 字段现在接收由AI生成的、更优质的纯文本内容
        '摘要': {
          rich_text: [
            {
              text: {
                content: data.summary,
              },
            },
          ],
        },
        '原始链接': {
          url: data.originalUrl,
        },
        '创建时间': {
          date: {
            start: data.createdAt,
          },
        },
        // 'Tags' 字段的逻辑保持不变，它接收格式化好的 multi_select 数据
        ...(data.tags && data.tags.length > 0 && {
          'Tags': {
            multi_select: data.tags
          }
        }),
        ...(data.htmlUrl && data.htmlUrl.startsWith('http') && {
          'html文件': {
            url: data.htmlUrl
          }
        })
      },
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
