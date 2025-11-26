/**
 * Legacy & Heritage Manager
 * Semana 56, Tarea 56.3: Legacy Documentation & Heritage Preservation
 */

import { logger } from "@/lib/monitoring"

export interface LegacyDocument {
  id: string
  documentTitle: string
  documentType:
    | "case-study"
    | "whitepaper"
    | "best-practice"
    | "lessons-learned"
  createdDate: Date
  contributor: string
  content: string
  impact: string
  archiveStatus: "active" | "archived"
}

export interface HeritageEntry {
  id: string
  entryName: string
  category: "milestone" | "achievement" | "challenge" | "innovation"
  date: Date
  description: string
  significance: number
  impact: string[]
}

export class LegacyHeritageManager {
  private legacyDocuments: Map<string, LegacyDocument> = new Map()
  private heritageEntries: Map<string, HeritageEntry> = new Map()

  constructor() {
    logger.debug({ type: "legacy_heritage_init" }, "Manager inicializado")
  }

  createLegacyDocument(
    documentTitle: string,
    documentType:
      | "case-study"
      | "whitepaper"
      | "best-practice"
      | "lessons-learned",
    contributor: string,
    content: string,
    impact: string
  ): LegacyDocument {
    const id = "legacy_" + Date.now()
    const doc: LegacyDocument = {
      id,
      documentTitle,
      documentType,
      createdDate: new Date(),
      contributor,
      content,
      impact,
      archiveStatus: "active",
    }

    this.legacyDocuments.set(id, doc)
    logger.info(
      { type: "legacy_document_created", docId: id },
      `Documento de legado creado: ${documentTitle}`
    )
    return doc
  }

  recordHeritageEntry(
    entryName: string,
    category: "milestone" | "achievement" | "challenge" | "innovation",
    date: Date,
    description: string,
    significance: number,
    impact: string[]
  ): HeritageEntry {
    const id = "heritage_" + Date.now()
    const entry: HeritageEntry = {
      id,
      entryName,
      category,
      date,
      description,
      significance,
      impact,
    }

    this.heritageEntries.set(id, entry)
    logger.info(
      { type: "heritage_entry_recorded", entryId: id },
      `Entrada de patrimonio registrada: ${entryName}`
    )
    return entry
  }

  getStatistics(): Record<string, unknown> {
    const documents = Array.from(this.legacyDocuments.values())
    const entries = Array.from(this.heritageEntries.values())

    return {
      totalLegacyDocuments: documents.length,
      documentsByType: {
        caseStudy: documents.filter((d) => d.documentType === "case-study")
          .length,
        whitepaper: documents.filter((d) => d.documentType === "whitepaper")
          .length,
        bestPractice: documents.filter((d) => d.documentType === "best-practice")
          .length,
        lessonsLearned: documents.filter(
          (d) => d.documentType === "lessons-learned"
        ).length,
      },
      totalHeritageEntries: entries.length,
      entriesByCategory: {
        milestone: entries.filter((e) => e.category === "milestone").length,
        achievement: entries.filter((e) => e.category === "achievement").length,
        challenge: entries.filter((e) => e.category === "challenge").length,
        innovation: entries.filter((e) => e.category === "innovation").length,
      },
      averageSignificance:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.significance, 0) / entries.length
          : 0,
    }
  }

  generateLegacyReport(): string {
    const stats = this.getStatistics()
    return `Legacy & Heritage Report\nDocuments: ${stats.totalLegacyDocuments}\nHeritage Entries: ${stats.totalHeritageEntries}\nAverage Significance: ${stats.averageSignificance.toFixed(2)}`
  }
}

let globalLegacyHeritageManager: LegacyHeritageManager | null = null

export function getLegacyHeritageManager(): LegacyHeritageManager {
  if (!globalLegacyHeritageManager) {
    globalLegacyHeritageManager = new LegacyHeritageManager()
  }
  return globalLegacyHeritageManager
}
