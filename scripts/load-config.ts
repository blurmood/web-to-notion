import * as fs from 'fs';
import * as path from 'path';

// 定义配置接口
interface Config {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  TG_IMAGE_HOST: string;
  OPENAI_API_KEY?: string; // OpenAI Key可能是可选的
}

/**
 * 解析Markdown文件内容，提取配置信息
 * @param content Markdown文件的内容
 * @returns 解析后的配置对象
 */
function parseConfigFromMarkdown(content: string): Partial<Config> {
  const config: Partial<Config> = {};
  const lines = content.split('\n');

  lines.forEach(line => {
    if (line.startsWith('databaseid:')) {
      config.NOTION_DATABASE_ID = line.substring('databaseid:'.length).trim();
    } else if (line.startsWith('notion令牌：')) {
      config.NOTION_TOKEN = line.substring('notion令牌：'.length).trim();
    } else if (line.startsWith('## 图床域名')) {
      // 假设域名在下一行
      const nextLineIndex = lines.indexOf(line) + 1;
      if (nextLineIndex < lines.length) {
        config.TG_IMAGE_HOST = lines[nextLineIndex].trim();
      }
    }
    // 您可以按照这个模式添加对 OPENAI_API_KEY 的解
    // 例如，在.md文件中添加一行： openai_api_key: sk-xxxx...
    else if (line.startsWith('openai_api_key:')) {
        config.OPENAI_API_KEY = line.substring('openai_api_key:'.length).trim();
    }
  });

  return config;
}

/**
 * 主函数：读取、解析并输出环境变量设置命令
 */
function main() {
  try {
    const mdPath = path.resolve(__dirname, '../../web-clipper.md');
    const content = fs.readFileSync(mdPath, 'utf-8');
    const config = parseConfigFromMarkdown(content);

    console.log('## Copy and paste these commands into your terminal to set environment variables for local development:');
    console.log('#'.repeat(80));
    
    let exportCommands = '';
    if (config.NOTION_TOKEN) {
      exportCommands += `export NOTION_TOKEN="${config.NOTION_TOKEN}"\n`;
    }
    if (config.NOTION_DATABASE_ID) {
      exportCommands += `export NOTION_DATABASE_ID="${config.NOTION_DATABASE_ID}"\n`;
    }
    if (config.TG_IMAGE_HOST) {
      exportCommands += `export TG_IMAGE_HOST="${config.TG_IMAGE_HOST}"\n`;
    }
    if (config.OPENAI_API_KEY) {
        exportCommands += `export OPENAI_API_KEY="${config.OPENAI_API_KEY}"\n`;
    }

    console.log(exportCommands);
    console.log('#'.repeat(80));
    console.log('## After running the commands, you can start the dev server with: npm run dev');


  } catch (error) {
    console.error('Error loading configuration:', error);
    process.exit(1);
  }
}

main();
