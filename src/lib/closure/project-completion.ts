/**
 * Project Completion Manager
 * Semana 52, Tarea 52.1: Formal Project Completion & Closure
 */

import { logger } from "@/lib/monitoring"

export interface CompletionTask {
  id: string
  name: string
  description: string
  category: "delivery" | "documentation" | "signoff" | "handover"
  dueDate: Date
  status: "pending" | "in-progress" | "completed" | "blocked"
  owner: string
  blockers: string[]
  completionDate?: Date
}

export interface ProjectCloseout {
  id: string
  projectId: string
  projectName: string
  startDate: Date
  completionDate: Date
  actualEndDate: Date
  durationDays: number
  status: "planning" | "executing" | "completed"
  completionPercentage: number
  completionTasks: CompletionTask[]
}

export class ProjectCompletionManager {
  private completionTasks: Map<string, CompletionTask> = new Map()
  private closeouts: Map<string, ProjectCloseout> = new Map()

  constructor() {
    logger.debug({ type: "project_completion_init" }, "Manager inicializado")
  }

  startProjectCloseout(
    projectId: string,
    projectName: string,
    startDate: Date
  ): ProjectCloseout {
    const id = "closeout_" + Date.now()
    const actualEndDate = new Date()
    const durationDays = Math.ceil(
      (actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const closeout: ProjectCloseout = {
      id,
      projectId,
      projectName,
      startDate,
      completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      actualEndDate,
      durationDays,
      status: "planning",
      completionPercentage: 0,
      completionTasks: [],
    }

    this.closeouts.set(id, closeout)
    logger.info(
      { type: "project_closeout_started", closeoutId: id },
      `Cierre del proyecto iniciado: ${projectName}`
    )
    return closeout
  }

  addCompletionTask(
    closeoutId: string,
    name: string,
    description: string,
    category: "delivery" | "documentation" | "signoff" | "handover",
    dueDate: Date,
    owner: string
  ): CompletionTask | null {
    const closeout = this.closeouts.get(closeoutId)
    if (!closeout) return null

    const task: CompletionTask = {
      id: "task_" + Date.now(),
      name,
      description,
      category,
      dueDate,
      status: "pending",
      owner,
      blockers: [],
    }

    closeout.completionTasks.push(task)
    this.completionTasks.set(task.id, task)
    logger.info(
      { type: "completion_task_added", closeoutId },
      `Tarea de cierre agregada: ${name}`
    )
    return task
  }

  updateTaskStatus(
    taskId: string,
    status: "pending" | "in-progress" | "completed" | "blocked",
    completionDate?: Date
  ): CompletionTask | null {
    const task = this.completionTasks.get(taskId)
    if (!task) return null

    task.status = status
    if (completionDate) task.completionDate = completionDate

    this.completionTasks.set(taskId, task)
    logger.info({ type: "task_status_updated", taskId }, `Estado de tarea actualizado`)
    return task
  }

  addBlocker(taskId: string, blocker: string): CompletionTask | null {
    const task = this.completionTasks.get(taskId)
    if (!task) return null

    task.blockers.push(blocker)
    task.status = "blocked"

    this.completionTasks.set(taskId, task)
    logger.warn({ type: "task_blocked", taskId }, `Tarea bloqueada`)
    return task
  }

  completeProject(closeoutId: string): ProjectCloseout | null {
    const closeout = this.closeouts.get(closeoutId)
    if (!closeout) return null

    const completedTasks = closeout.completionTasks.filter(
      (t) => t.status === "completed"
    ).length
    closeout.completionPercentage =
      (completedTasks / closeout.completionTasks.length) * 100 || 0
    closeout.status = "completed"

    this.closeouts.set(closeoutId, closeout)
    logger.info(
      { type: "project_completed", closeoutId },
      `Proyecto completado: ${closeout.projectName}`
    )
    return closeout
  }

  getCompletionStatus(closeoutId: string): ProjectCloseout | null {
    return this.closeouts.get(closeoutId) || null
  }

  getStatistics(): Record<string, unknown> {
    const tasks = Array.from(this.completionTasks.values())
    const closeouts = Array.from(this.closeouts.values())

    return {
      totalCloseouts: closeouts.length,
      totalTasks: tasks.length,
      tasksByStatus: {
        pending: tasks.filter((t) => t.status === "pending").length,
        inProgress: tasks.filter((t) => t.status === "in-progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        blocked: tasks.filter((t) => t.status === "blocked").length,
      },
      tasksByCategory: {
        delivery: tasks.filter((t) => t.category === "delivery").length,
        documentation: tasks.filter((t) => t.category === "documentation").length,
        signoff: tasks.filter((t) => t.category === "signoff").length,
        handover: tasks.filter((t) => t.category === "handover").length,
      },
      averageCompletionPercent:
        closeouts.length > 0
          ? closeouts.reduce((sum, c) => sum + c.completionPercentage, 0) /
            closeouts.length
          : 0,
    }
  }

  generateCompletionReport(): string {
    const stats = this.getStatistics()
    return `Project Completion Report\nTotal Closeouts: ${stats.totalCloseouts}\nTotal Tasks: ${stats.totalTasks}\nAverage Completion: ${stats.averageCompletionPercent.toFixed(2)}%`
  }
}

let globalProjectCompletionManager: ProjectCompletionManager | null = null

export function getProjectCompletionManager(): ProjectCompletionManager {
  if (!globalProjectCompletionManager) {
    globalProjectCompletionManager = new ProjectCompletionManager()
  }
  return globalProjectCompletionManager
}
