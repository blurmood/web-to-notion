// 定义Cloudflare Worker的环境变量类型
export type Env = {
  // In wrangler.toml
  TG_IMAGE_HOST: string;
  NOTION_DATABASE_ID: string;

  // In .dev.vars or as secrets in production
  NOTION_TOKEN: string;
  GEMINI_API_KEY: string; // Changed from OPENAI_API_KEY
}

export interface ClippedData {
  title: string;
  summary: string;
  originalUrl: string;
  tags: string[];
  htmlUrl: string;
}

export interface NotionPage {
  title: string;
  summary: string;
  originalUrl: string;
  tags: { name: string }[];
  createdAt: string;
  htmlUrl: string;
}
