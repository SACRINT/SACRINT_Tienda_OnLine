/**
 * Knowledge Base Manager
 * Semana 48, Tarea 48.12: Knowledge Base Management
 */

import { logger } from "@/lib/monitoring";

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  articles: KnowledgeArticle[];
  lastUpdated: Date;
  totalArticles: number;
}

export class KnowledgeBaseManager {
  private articles: Map<string, KnowledgeArticle> = new Map();
  private bases: Map<string, KnowledgeBase> = new Map();
  private searchIndex: Map<string, string[]> = new Map();

  constructor() {
    logger.debug({ type: "kb_init" }, "Knowledge Base Manager inicializado");
  }

  createArticle(
    title: string,
    category: string,
    content: string,
    tags: string[],
    author: string,
  ): KnowledgeArticle {
    const article: KnowledgeArticle = {
      id: `article_${Date.now()}`,
      title,
      category,
      content,
      tags,
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
    };
    this.articles.set(article.id, article);

    tags.forEach((tag) => {
      if (!this.searchIndex.has(tag)) {
        this.searchIndex.set(tag, []);
      }
      this.searchIndex.get(tag)?.push(article.id);
    });

    logger.info({ type: "article_created" }, `Article: ${title}`);
    return article;
  }

  searchArticles(query: string): KnowledgeArticle[] {
    const articleIds = this.searchIndex.get(query) || [];
    return articleIds
      .map((id) => this.articles.get(id))
      .filter((a): a is KnowledgeArticle => a !== undefined);
  }

  createKnowledgeBase(name: string): KnowledgeBase {
    const base: KnowledgeBase = {
      id: `kb_${Date.now()}`,
      name,
      articles: Array.from(this.articles.values()),
      lastUpdated: new Date(),
      totalArticles: this.articles.size,
    };
    this.bases.set(base.id, base);
    logger.info({ type: "kb_created" }, `Knowledge Base: ${name}`);
    return base;
  }

  getStatistics() {
    return {
      totalArticles: this.articles.size,
      knowledgeBases: this.bases.size,
      totalViews: Array.from(this.articles.values()).reduce((sum, a) => sum + a.viewCount, 0),
    };
  }
}

let globalKBManager: KnowledgeBaseManager | null = null;

export function getKnowledgeBaseManager(): KnowledgeBaseManager {
  if (!globalKBManager) {
    globalKBManager = new KnowledgeBaseManager();
  }
  return globalKBManager;
}
