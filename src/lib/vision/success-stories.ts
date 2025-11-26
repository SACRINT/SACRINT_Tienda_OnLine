/**
 * Success Story Documentation Manager
 * Semana 56, Tarea 56.7: Success Story Documentation & Best Practices
 */

import { logger } from "@/lib/monitoring"

export interface SuccessStory {
  id: string
  storyTitle: string
  storyCategory: "customer" | "product" | "innovation" | "operational"
  author: string
  publishDate: Date
  businessImpact: string
  metrics: Record<string, string | number>
  lessonsLearned: string[]
  replicability: "high" | "medium" | "low"
  featured: boolean
}

export interface BestPractice {
  id: string
  practiceName: string
  domain: string
  description: string
  implementationSteps: string[]
  expectedBenefits: string[]
  successCriteria: string[]
  adoptionLevel: number
  maturityLevel: 1 | 2 | 3 | 4 | 5
}

export class SuccessStoryManager {
  private successStories: Map<string, SuccessStory> = new Map()
  private bestPractices: Map<string, BestPractice> = new Map()

  constructor() {
    logger.debug({ type: "success_stories_init" }, "Manager inicializado")
  }

  documentSuccessStory(
    storyTitle: string,
    storyCategory: "customer" | "product" | "innovation" | "operational",
    author: string,
    businessImpact: string,
    metrics: Record<string, string | number>,
    lessonsLearned: string[],
    replicability: "high" | "medium" | "low"
  ): SuccessStory {
    const id = "story_" + Date.now()
    const story: SuccessStory = {
      id,
      storyTitle,
      storyCategory,
      author,
      publishDate: new Date(),
      businessImpact,
      metrics,
      lessonsLearned,
      replicability,
      featured: false,
    }

    this.successStories.set(id, story)
    logger.info(
      { type: "success_story_documented", storyId: id },
      `Historia de éxito documentada: ${storyTitle}`
    )
    return story
  }

  registerBestPractice(
    practiceName: string,
    domain: string,
    description: string,
    implementationSteps: string[],
    expectedBenefits: string[],
    successCriteria: string[],
    maturityLevel: 1 | 2 | 3 | 4 | 5
  ): BestPractice {
    const id = "practice_" + Date.now()
    const practice: BestPractice = {
      id,
      practiceName,
      domain,
      description,
      implementationSteps,
      expectedBenefits,
      successCriteria,
      adoptionLevel: 0,
      maturityLevel,
    }

    this.bestPractices.set(id, practice)
    logger.info(
      { type: "best_practice_registered", practiceId: id },
      `Mejor práctica registrada: ${practiceName}`
    )
    return practice
  }

  featureStory(storyId: string): SuccessStory | null {
    const story = this.successStories.get(storyId)
    if (!story) return null

    story.featured = true
    logger.info(
      { type: "story_featured", storyId },
      `Historia destacada: ${story.storyTitle}`
    )
    return story
  }

  getStatistics(): Record<string, unknown> {
    const stories = Array.from(this.successStories.values())
    const practices = Array.from(this.bestPractices.values())

    return {
      totalSuccessStories: stories.length,
      storiesByCategory: {
        customer: stories.filter((s) => s.storyCategory === "customer").length,
        product: stories.filter((s) => s.storyCategory === "product").length,
        innovation: stories.filter((s) => s.storyCategory === "innovation")
          .length,
        operational: stories.filter((s) => s.storyCategory === "operational")
          .length,
      },
      featuredStories: stories.filter((s) => s.featured).length,
      storiesByReplicability: {
        high: stories.filter((s) => s.replicability === "high").length,
        medium: stories.filter((s) => s.replicability === "medium").length,
        low: stories.filter((s) => s.replicability === "low").length,
      },
      totalBestPractices: practices.length,
      averageAdoptionLevel:
        practices.length > 0
          ? practices.reduce((sum, p) => sum + p.adoptionLevel, 0) /
            practices.length
          : 0,
      averageMaturityLevel:
        practices.length > 0
          ? practices.reduce((sum, p) => sum + p.maturityLevel, 0) /
            practices.length
          : 0,
    }
  }

  generateStoriesReport(): string {
    const stats = this.getStatistics()
    return `Success Stories Report\nStories: ${stats.totalSuccessStories}\nBest Practices: ${stats.totalBestPractices}\nAvg Adoption: ${stats.averageAdoptionLevel.toFixed(1)}`
  }
}

let globalSuccessStoryManager: SuccessStoryManager | null = null

export function getSuccessStoryManager(): SuccessStoryManager {
  if (!globalSuccessStoryManager) {
    globalSuccessStoryManager = new SuccessStoryManager()
  }
  return globalSuccessStoryManager
}
