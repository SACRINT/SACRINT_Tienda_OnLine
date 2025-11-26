/**
 * Project Retrospective & Final Analysis Manager
 * Semana 56, Tarea 56.12: Project Retrospective & Strategic Assessment
 */

import { logger } from "@/lib/monitoring"

export interface ProjectPhase {
  id: string
  phaseName: string
  phaseNumber: number
  startDate: Date
  endDate: Date
  objectivesAchieved: string[]
  challengesFaced: string[]
  lessonsLearned: string[]
  successMetrics: Record<string, number>
  teamFeedback: string[]
}

export interface FinalAssessment {
  id: string
  assessmentDate: Date
  projectStatus: "completed" | "successful" | "exceeds-expectations"
  overallScore: number
  quantitativeResults: Record<string, number>
  qualitativeFindings: string[]
  stakeholderSatisfaction: number
  recommendations: string[]
  futureConsiderations: string[]
}

export interface LegacyStatement {
  id: string
  createdDate: Date
  projectSummary: string
  keyAchievements: string[]
  transformationalImpact: string
  teamContribution: string
  futureVision: string
  historicalSignificance: number
}

export class ProjectRetrospectiveManager {
  private phases: Map<string, ProjectPhase> = new Map()
  private finalAssessments: Map<string, FinalAssessment> = new Map()
  private legacyStatements: Map<string, LegacyStatement> = new Map()

  constructor() {
    logger.debug(
      { type: "project_retrospective_init" },
      "Manager inicializado"
    )
  }

  recordProjectPhase(
    phaseName: string,
    phaseNumber: number,
    startDate: Date,
    endDate: Date,
    objectivesAchieved: string[],
    challengesFaced: string[],
    lessonsLearned: string[],
    successMetrics: Record<string, number>,
    teamFeedback: string[]
  ): ProjectPhase {
    const id = "phase_" + Date.now()
    const phase: ProjectPhase = {
      id,
      phaseName,
      phaseNumber,
      startDate,
      endDate,
      objectivesAchieved,
      challengesFaced,
      lessonsLearned,
      successMetrics,
      teamFeedback,
    }

    this.phases.set(id, phase)
    logger.info(
      { type: "project_phase_recorded", phaseId: id },
      `Fase del proyecto registrada: ${phaseName}`
    )
    return phase
  }

  conductFinalAssessment(
    projectStatus: "completed" | "successful" | "exceeds-expectations",
    overallScore: number,
    quantitativeResults: Record<string, number>,
    qualitativeFindings: string[],
    stakeholderSatisfaction: number,
    recommendations: string[],
    futureConsiderations: string[]
  ): FinalAssessment {
    const id = "assessment_" + Date.now()
    const assessment: FinalAssessment = {
      id,
      assessmentDate: new Date(),
      projectStatus,
      overallScore,
      quantitativeResults,
      qualitativeFindings,
      stakeholderSatisfaction,
      recommendations,
      futureConsiderations,
    }

    this.finalAssessments.set(id, assessment)
    logger.info(
      { type: "final_assessment_conducted", assessmentId: id },
      `Evaluación final realizada: ${projectStatus}`
    )
    return assessment
  }

  createLegacyStatement(
    projectSummary: string,
    keyAchievements: string[],
    transformationalImpact: string,
    teamContribution: string,
    futureVision: string,
    historicalSignificance: number
  ): LegacyStatement {
    const id = "legacy_" + Date.now()
    const statement: LegacyStatement = {
      id,
      createdDate: new Date(),
      projectSummary,
      keyAchievements,
      transformationalImpact,
      teamContribution,
      futureVision,
      historicalSignificance,
    }

    this.legacyStatements.set(id, statement)
    logger.info(
      { type: "legacy_statement_created", statementId: id },
      `Declaración de legado creada`
    )
    return statement
  }

  getStatistics(): Record<string, unknown> {
    const phases = Array.from(this.phases.values())
    const assessments = Array.from(this.finalAssessments.values())
    const legacies = Array.from(this.legacyStatements.values())

    const totalObjectives = phases.reduce(
      (sum, p) => sum + p.objectivesAchieved.length,
      0
    )
    const totalChallenges = phases.reduce(
      (sum, p) => sum + p.challengesFaced.length,
      0
    )

    return {
      totalProjectPhases: phases.length,
      totalObjectivesAchieved: totalObjectives,
      totalChallengesFaced: totalChallenges,
      objectivesChallengeRatio:
        totalChallenges > 0 ? totalObjectives / totalChallenges : 0,
      totalLessonsLearned: phases.reduce(
        (sum, p) => sum + p.lessonsLearned.length,
        0
      ),
      averagePhaseDuration:
        phases.length > 0
          ? phases.reduce((sum, p) => {
              const duration =
                (p.endDate.getTime() - p.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
              return sum + duration
            }, 0) / phases.length
          : 0,
      finalAssessmentsCompleted: assessments.length,
      averageOverallScore:
        assessments.length > 0
          ? assessments.reduce((sum, a) => sum + a.overallScore, 0) /
            assessments.length
          : 0,
      averageStakeholderSatisfaction:
        assessments.length > 0
          ? assessments.reduce((sum, a) => sum + a.stakeholderSatisfaction, 0) /
            assessments.length
          : 0,
      projectStatusDistribution: {
        completed: assessments.filter(
          (a) => a.projectStatus === "completed"
        ).length,
        successful: assessments.filter(
          (a) => a.projectStatus === "successful"
        ).length,
        exceedsExpectations: assessments.filter(
          (a) => a.projectStatus === "exceeds-expectations"
        ).length,
      },
      legacyStatementsCreated: legacies.length,
      averageHistoricalSignificance:
        legacies.length > 0
          ? legacies.reduce((sum, l) => sum + l.historicalSignificance, 0) /
            legacies.length
          : 0,
    }
  }

  generateFinalReport(): string {
    const stats = this.getStatistics()
    return `Project Retrospective & Final Analysis\nPhases: ${stats.totalProjectPhases}\nObjectives Achieved: ${stats.totalObjectivesAchieved}\nAvg Satisfaction: ${stats.averageStakeholderSatisfaction.toFixed(1)}`
  }
}

let globalProjectRetrospectiveManager: ProjectRetrospectiveManager | null =
  null

export function getProjectRetrospectiveManager(): ProjectRetrospectiveManager {
  if (!globalProjectRetrospectiveManager) {
    globalProjectRetrospectiveManager = new ProjectRetrospectiveManager()
  }
  return globalProjectRetrospectiveManager
}
