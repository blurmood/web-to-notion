import * as cheerio from 'cheerio';

/**
 * 从HTML中解析出标题、正文内容和原始URL
 * @param html HTML字符串
 * @returns 解析出的数据
 */
export function parseHtml(html: string) {
  const $ = cheerio.load(html);

  // 移除脚本和样式，减少干扰
  $('script, style, noscript, iframe, header, footer, nav').remove();

  const title = $('title').text() || $('h1').first().text();

  // 从HTML中提取原始URL，优先级顺序：
  // 1. canonical链接
  // 2. og:url meta标签
  // 3. 当前页面的base href
  // 4. 从HTML中的绝对链接推断
  let originalUrl = '';

  // 尝试获取canonical URL
  const canonicalUrl = $('link[rel="canonical"]').attr('href');
  if (canonicalUrl) {
    originalUrl = canonicalUrl;
  }

  // 尝试获取Open Graph URL
  if (!originalUrl) {
    const ogUrl = $('meta[property="og:url"]').attr('content');
    if (ogUrl) {
      originalUrl = ogUrl;
    }
  }

  // 尝试获取base href
  if (!originalUrl) {
    const baseHref = $('base').attr('href');
    if (baseHref) {
      originalUrl = baseHref;
    }
  }

  // 如果都没有找到，使用默认值
  if (!originalUrl) {
    originalUrl = 'https://unknown-source.com';
  }

  // 提取body的纯文本内容作为AI分析的原材料
  // 通过替换多个换行和空格，使文本更紧凑
  const mainContent = $('body').text()
    .replace(/\s\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return {
    title,
    originalUrl,
    mainContent,
  };
}

export async function uploadHtml(html: string, env: any): Promise<string> {
  console.log('Starting HTML upload to:', env.TG_IMAGE_HOST);
  console.log('HTML content length:', html.length);

  // 尝试不同的文件名和MIME类型，让图床正确识别为HTML
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const timestamp = Date.now();
  const filename = `webpage-${timestamp}.html`;

  const formData = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
    `--${boundary}--`,
    ''
  ].join('\r\n');

  console.log('Form data boundary:', boundary);
  console.log('Form data length:', formData.length);
  console.log('Filename:', filename);

  const response = await fetch(`https://${env.TG_IMAGE_HOST}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Accept': 'application/json'
    },
    body: formData
  });

  console.log('Upload response status:', response.status);
  console.log('Upload response content-type:', response.headers.get('content-type'));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload error response:', errorText);
    throw new Error(`Failed to upload HTML to image host: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Upload result:', result);

  // 根据测试结果，返回格式是 [{"src": "..."}]
  if (Array.isArray(result) && result.length > 0 && result[0].src) {
    const src = result[0].src;

    // 提取文件ID（去掉路径前缀）
    const fileId = src.replace('/file/', '');

    // 返回我们自己的代理链接，这样可以直接在浏览器中打开HTML
    const viewUrl = `https://web-to-notion.liuyiran.workers.dev/view/${fileId}`;

    console.log('Original file URL:', src);
    console.log('View URL (can open in browser):', viewUrl);
    return viewUrl;
  }

  console.error('Invalid result format:', result);
  throw new Error('Invalid response format from image host');
}
