/**
 * Lessons Learned Manager
 * Semana 52, Tarea 52.5: Lessons Learned & Continuous Improvement
 */

import { logger } from "@/lib/monitoring"

export interface Lesson {
  id: string
  title: string
  description: string
  category: "success" | "improvement" | "challenge" | "best-practice"
  phase: string
  impact: "high" | "medium" | "low"
  recommendedAction: string
  owner: string
  status: "documented" | "shared" | "implemented"
  dateRecorded: Date
}

export interface RetroSession {
  id: string
  projectName: string
  facilitator: string
  date: Date
  participants: string[]
  whatWentWell: string[]
  whatCouldImprove: string[]
  actionItems: ActionItem[]
  status: "scheduled" | "completed"
}

export interface ActionItem {
  id: string
  description: string
  owner: string
  dueDate: Date
  status: "open" | "in-progress" | "completed"
  priority: "high" | "medium" | "low"
}

export class LessonsLearnedManager {
  private lessons: Map<string, Lesson> = new Map()
  private retroSessions: Map<string, RetroSession> = new Map()
  private knowledgeRepository: Map<string, Lesson[]> = new Map()

  constructor() {
    logger.debug({ type: "lessons_learned_init" }, "Manager inicializado")
  }

  documentLesson(
    title: string,
    description: string,
    category: "success" | "improvement" | "challenge" | "best-practice",
    phase: string,
    impact: "high" | "medium" | "low",
    recommendedAction: string,
    owner: string
  ): Lesson {
    const id = "lesson_" + Date.now()
    const lesson: Lesson = {
      id,
      title,
      description,
      category,
      phase,
      impact,
      recommendedAction,
      owner,
      status: "documented",
      dateRecorded: new Date(),
    }

    this.lessons.set(id, lesson)

    const categoryLessons = this.knowledgeRepository.get(category) || []
    categoryLessons.push(lesson)
    this.knowledgeRepository.set(category, categoryLessons)

    logger.info(
      { type: "lesson_documented", lessonId: id },
      `Lección documentada: ${title}`
    )
    return lesson
  }

  shareLesson(lessonId: string): Lesson | null {
    const lesson = this.lessons.get(lessonId)
    if (!lesson) return null

    lesson.status = "shared"
    this.lessons.set(lessonId, lesson)
    logger.info({ type: "lesson_shared", lessonId }, `Lección compartida`)
    return lesson
  }

  scheduleRetroSession(
    projectName: string,
    facilitator: string,
    date: Date,
    participants: string[]
  ): RetroSession {
    const id = "retro_" + Date.now()
    const session: RetroSession = {
      id,
      projectName,
      facilitator,
      date,
      participants,
      whatWentWell: [],
      whatCouldImprove: [],
      actionItems: [],
      status: "scheduled",
    }

    this.retroSessions.set(id, session)
    logger.info(
      { type: "retro_session_scheduled", sessionId: id },
      `Sesión retro programada: ${projectName}`
    )
    return session
  }

  recordRetroFeedback(
    sessionId: string,
    whatWentWell: string[],
    whatCouldImprove: string[]
  ): RetroSession | null {
    const session = this.retroSessions.get(sessionId)
    if (!session) return null

    session.whatWentWell = whatWentWell
    session.whatCouldImprove = whatCouldImprove
    session.status = "completed"

    this.retroSessions.set(sessionId, session)
    logger.info(
      { type: "retro_feedback_recorded", sessionId },
      `Feedback de retro registrado`
    )
    return session
  }

  addActionItem(
    sessionId: string,
    description: string,
    owner: string,
    dueDate: Date,
    priority: "high" | "medium" | "low"
  ): ActionItem | null {
    const session = this.retroSessions.get(sessionId)
    if (!session) return null

    const actionItem: ActionItem = {
      id: "action_" + Date.now(),
      description,
      owner,
      dueDate,
      status: "open",
      priority,
    }

    session.actionItems.push(actionItem)
    this.retroSessions.set(sessionId, session)
    logger.info(
      { type: "action_item_added", sessionId },
      `Elemento de acción agregado`
    )
    return actionItem
  }

  getLessonsByCategory(
    category: "success" | "improvement" | "challenge" | "best-practice"
  ): Lesson[] {
    return this.knowledgeRepository.get(category) || []
  }

  getLessonsByImpact(impact: "high" | "medium" | "low"): Lesson[] {
    return Array.from(this.lessons.values()).filter((l) => l.impact === impact)
  }

  getStatistics(): Record<string, unknown> {
    const lessons = Array.from(this.lessons.values())
    const sessions = Array.from(this.retroSessions.values())

    return {
      totalLessons: lessons.length,
      lessonsByCategory: {
        success: lessons.filter((l) => l.category === "success").length,
        improvement: lessons.filter((l) => l.category === "improvement").length,
        challenge: lessons.filter((l) => l.category === "challenge").length,
        bestPractice: lessons.filter((l) => l.category === "best-practice")
          .length,
      },
      lessonsByStatus: {
        documented: lessons.filter((l) => l.status === "documented").length,
        shared: lessons.filter((l) => l.status === "shared").length,
        implemented: lessons.filter((l) => l.status === "implemented").length,
      },
      totalRetroSessions: sessions.length,
      totalActionItems: sessions.reduce((sum, s) => sum + s.actionItems.length, 0),
      openActionItems: sessions.reduce(
        (sum, s) => sum + s.actionItems.filter((a) => a.status === "open").length,
        0
      ),
    }
  }

  generateLessonsReport(): string {
    const stats = this.getStatistics()
    return `Lessons Learned Report\nTotal Lessons: ${stats.totalLessons}\nRetro Sessions: ${stats.totalRetroSessions}\nAction Items: ${stats.totalActionItems}`
  }
}

let globalLessonsLearnedManager: LessonsLearnedManager | null = null

export function getLessonsLearnedManager(): LessonsLearnedManager {
  if (!globalLessonsLearnedManager) {
    globalLessonsLearnedManager = new LessonsLearnedManager()
  }
  return globalLessonsLearnedManager
}
