/**
 * Team Transition Manager
 * Semana 52, Tarea 52.3: Team Transition & Offboarding Planning
 */

import { logger } from "@/lib/monitoring"

export interface TeamMemberTransition {
  id: string
  employeeId: string
  employeeName: string
  role: string
  transitionType: "internal-move" | "external-move" | "promotion" | "separation"
  departureDate: Date
  replacement?: string
  offboardingTasks: OffboardingTask[]
  exitInterviewDate?: Date
  feedbackProvided: boolean
}

export interface OffboardingTask {
  id: string
  description: string
  category: "access" | "knowledge" | "equipment" | "financial" | "legal"
  dueDate: Date
  owner: string
  status: "pending" | "completed"
  completedDate?: Date
}

export interface TransitionPlan {
  id: string
  projectName: string
  currentOwner: string
  newOwner: string
  transitionStartDate: Date
  transitionCompleteDate: Date
  knowledgeTransferTopics: string[]
  handoverDocuments: string[]
  status: "planning" | "in-progress" | "completed"
}

export class TeamTransitionManager {
  private transitions: Map<string, TeamMemberTransition> = new Map()
  private offboardingTasks: Map<string, OffboardingTask[]> = new Map()
  private transitionPlans: Map<string, TransitionPlan> = new Map()

  constructor() {
    logger.debug({ type: "team_transition_init" }, "Manager inicializado")
  }

  initiateTeamMemberTransition(
    employeeId: string,
    employeeName: string,
    role: string,
    transitionType: "internal-move" | "external-move" | "promotion" | "separation",
    departureDate: Date,
    replacement?: string
  ): TeamMemberTransition {
    const id = "transition_" + Date.now()
    const transition: TeamMemberTransition = {
      id,
      employeeId,
      employeeName,
      role,
      transitionType,
      departureDate,
      replacement,
      offboardingTasks: [],
      feedbackProvided: false,
    }

    this.transitions.set(id, transition)
    this.offboardingTasks.set(id, [])
    logger.info(
      { type: "team_transition_initiated", transitionId: id },
      `Transición iniciada: ${employeeName}`
    )
    return transition
  }

  addOffboardingTask(
    transitionId: string,
    description: string,
    category: "access" | "knowledge" | "equipment" | "financial" | "legal",
    dueDate: Date,
    owner: string
  ): OffboardingTask | null {
    const transition = this.transitions.get(transitionId)
    if (!transition) return null

    const task: OffboardingTask = {
      id: "task_" + Date.now(),
      description,
      category,
      dueDate,
      owner,
      status: "pending",
    }

    transition.offboardingTasks.push(task)
    const tasks = this.offboardingTasks.get(transitionId) || []
    tasks.push(task)
    this.offboardingTasks.set(transitionId, tasks)

    logger.info(
      { type: "offboarding_task_added", transitionId },
      `Tarea de offboarding agregada: ${category}`
    )
    return task
  }

  completeOffboardingTask(
    taskId: string,
    transitionId: string
  ): OffboardingTask | null {
    const tasks = this.offboardingTasks.get(transitionId) || []
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return null

    task.status = "completed"
    task.completedDate = new Date()

    logger.info(
      { type: "offboarding_task_completed", taskId },
      `Tarea completada`
    )
    return task
  }

  scheduleExitInterview(
    transitionId: string,
    interviewDate: Date
  ): TeamMemberTransition | null {
    const transition = this.transitions.get(transitionId)
    if (!transition) return null

    transition.exitInterviewDate = interviewDate
    this.transitions.set(transitionId, transition)
    return transition
  }

  recordExitFeedback(transitionId: string): TeamMemberTransition | null {
    const transition = this.transitions.get(transitionId)
    if (!transition) return null

    transition.feedbackProvided = true
    this.transitions.set(transitionId, transition)
    logger.info(
      { type: "exit_feedback_recorded", transitionId },
      `Feedback de salida registrado`
    )
    return transition
  }

  createProjectTransitionPlan(
    projectName: string,
    currentOwner: string,
    newOwner: string,
    transitionStartDate: Date,
    transitionCompleteDate: Date,
    knowledgeTransferTopics: string[]
  ): TransitionPlan {
    const id = "plan_" + Date.now()
    const plan: TransitionPlan = {
      id,
      projectName,
      currentOwner,
      newOwner,
      transitionStartDate,
      transitionCompleteDate,
      knowledgeTransferTopics,
      handoverDocuments: [],
      status: "planning",
    }

    this.transitionPlans.set(id, plan)
    logger.info(
      { type: "transition_plan_created", planId: id },
      `Plan de transición creado: ${projectName}`
    )
    return plan
  }

  getStatistics(): Record<string, unknown> {
    const transitions = Array.from(this.transitions.values())
    const plans = Array.from(this.transitionPlans.values())

    return {
      totalTransitions: transitions.length,
      byTransitionType: {
        internalMove: transitions.filter((t) => t.transitionType === "internal-move")
          .length,
        externalMove: transitions.filter((t) => t.transitionType === "external-move")
          .length,
        promotion: transitions.filter((t) => t.transitionType === "promotion").length,
        separation: transitions.filter((t) => t.transitionType === "separation")
          .length,
      },
      withExitInterview: transitions.filter((t) => t.exitInterviewDate).length,
      withFeedback: transitions.filter((t) => t.feedbackProvided).length,
      totalTransitionPlans: plans.length,
      plansByStatus: {
        planning: plans.filter((p) => p.status === "planning").length,
        inProgress: plans.filter((p) => p.status === "in-progress").length,
        completed: plans.filter((p) => p.status === "completed").length,
      },
    }
  }

  generateTransitionReport(): string {
    const stats = this.getStatistics()
    return `Team Transition Report\nTotal Transitions: ${stats.totalTransitions}\nTransition Plans: ${stats.totalTransitionPlans}\nWith Exit Interviews: ${stats.withExitInterview}`
  }
}

let globalTeamTransitionManager: TeamTransitionManager | null = null

export function getTeamTransitionManager(): TeamTransitionManager {
  if (!globalTeamTransitionManager) {
    globalTeamTransitionManager = new TeamTransitionManager()
  }
  return globalTeamTransitionManager
}
