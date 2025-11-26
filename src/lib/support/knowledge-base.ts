/**
 * Knowledge Base & FAQ
 * Semana 41, Tarea 41.3: Knowledge Base & FAQ
 */

import { logger } from '@/lib/monitoring'

export interface KBArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  views: number
  helpfulCount: number
  unhelpfulCount: number
  createdAt: Date
  updatedAt: Date
  published: boolean
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  views: number
  helpful: number
  createdAt: Date
}

export class KnowledgeBaseManager {
  private articles: Map<string, KBArticle> = new Map()
  private faqs: Map<string, FAQ> = new Map()
  private searchIndex: Map<string, string[]> = new Map()

  constructor() {
    logger.debug({ type: 'knowledge_base_init' }, 'Knowledge Base Manager inicializado')
  }

  /**
   * Crear artículo
   */
  createArticle(title: string, content: string, category: string, tags: string[]): KBArticle {
    const article: KBArticle = {
      id: `article_${Date.now()}`,
      title,
      content,
      category,
      tags,
      views: 0,
      helpfulCount: 0,
      unhelpfulCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      published: false,
    }

    this.articles.set(article.id, article)
    this.indexArticle(article)

    logger.info({ type: 'article_created', articleId: article.id, title }, `Artículo creado: ${title}`)

    return article
  }

  /**
   * Indexar artículo
   */
  private indexArticle(article: KBArticle): void {
    const words = `${article.title} ${article.content}`.toLowerCase().split(/\s+/)

    for (const word of words) {
      if (word.length > 3) {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, [])
        }
        this.searchIndex.get(word)!.push(article.id)
      }
    }
  }

  /**
   * Publicar artículo
   */
  publishArticle(articleId: string): boolean {
    const article = this.articles.get(articleId)
    if (!article) return false

    article.published = true
    article.updatedAt = new Date()

    logger.info({ type: 'article_published', articleId }, `Artículo publicado: ${articleId}`)

    return true
  }

  /**
   * Registrar vista
   */
  recordView(articleId: string): void {
    const article = this.articles.get(articleId)
    if (article) {
      article.views++
    }
  }

  /**
   * Marcar como útil
   */
  markHelpful(articleId: string, helpful: boolean): void {
    const article = this.articles.get(articleId)
    if (article) {
      if (helpful) {
        article.helpfulCount++
      } else {
        article.unhelpfulCount++
      }
    }
  }

  /**
   * Crear FAQ
   */
  createFAQ(question: string, answer: string, category: string): FAQ {
    const faq: FAQ = {
      id: `faq_${Date.now()}`,
      question,
      answer,
      category,
      views: 0,
      helpful: 0,
      createdAt: new Date(),
    }

    this.faqs.set(faq.id, faq)

    logger.info({ type: 'faq_created', faqId: faq.id }, `FAQ creado: ${question}`)

    return faq
  }

  /**
   * Buscar artículos
   */
  searchArticles(query: string, category?: string): KBArticle[] {
    const queryWords = query.toLowerCase().split(/\s+/)
    let results = Array.from(this.articles.values()).filter((a) => a.published)

    if (category) {
      results = results.filter((a) => a.category === category)
    }

    // Score basado en matching
    const scored = results.map((article) => {
      let score = 0
      for (const word of queryWords) {
        if (article.title.toLowerCase().includes(word)) score += 2
        if (article.content.toLowerCase().includes(word)) score += 1
      }
      return { article, score }
    })

    return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.article)
  }

  /**
   * Obtener artículos populares
   */
  getPopularArticles(limit: number = 10): KBArticle[] {
    return Array.from(this.articles.values())
      .filter((a) => a.published)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  }

  /**
   * Obtener FAQs
   */
  getFAQs(category?: string): FAQ[] {
    let faqs = Array.from(this.faqs.values())
    return category ? faqs.filter((f) => f.category === category) : faqs
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalArticles: number; publishedArticles: number; totalFAQs: number; totalViews: number } {
    const articles = Array.from(this.articles.values())
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0)

    return {
      totalArticles: articles.length,
      publishedArticles: articles.filter((a) => a.published).length,
      totalFAQs: this.faqs.size,
      totalViews,
    }
  }
}

let globalKnowledgeBaseManager: KnowledgeBaseManager | null = null

export function initializeKnowledgeBaseManager(): KnowledgeBaseManager {
  if (!globalKnowledgeBaseManager) {
    globalKnowledgeBaseManager = new KnowledgeBaseManager()
  }
  return globalKnowledgeBaseManager
}

export function getKnowledgeBaseManager(): KnowledgeBaseManager {
  if (!globalKnowledgeBaseManager) {
    return initializeKnowledgeBaseManager()
  }
  return globalKnowledgeBaseManager
}
