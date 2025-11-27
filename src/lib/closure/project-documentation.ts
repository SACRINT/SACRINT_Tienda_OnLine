/**
 * Project Documentation Manager
 * Semana 52, Tarea 52.6: Final Project Documentation & Archival
 */

import { logger } from "@/lib/monitoring";

export interface ProjectDocument {
  id: string;
  title: string;
  type: "technical" | "business" | "operational" | "management";
  content: string;
  author: string;
  createdDate: Date;
  lastUpdated: Date;
  status: "draft" | "review" | "approved" | "archived";
  version: string;
  tags: string[];
}

export interface DocumentationIndex {
  id: string;
  projectName: string;
  projectId: string;
  createdDate: Date;
  documents: DocumentReference[];
  totalPages: number;
  completeness: number;
  lastReviewed: Date;
}

export interface DocumentReference {
  id: string;
  title: string;
  type: string;
  location: string;
  status: string;
  owner: string;
}

export class ProjectDocumentationManager {
  private documents: Map<string, ProjectDocument> = new Map();
  private documentationIndexes: Map<string, DocumentationIndex> = new Map();
  private documentationArchive: Map<string, ProjectDocument[]> = new Map();

  constructor() {
    logger.debug({ type: "project_documentation_init" }, "Manager inicializado");
  }

  createDocument(
    title: string,
    type: "technical" | "business" | "operational" | "management",
    content: string,
    author: string,
    tags: string[] = [],
  ): ProjectDocument {
    const id = "doc_" + Date.now();
    const document: ProjectDocument = {
      id,
      title,
      type,
      content,
      author,
      createdDate: new Date(),
      lastUpdated: new Date(),
      status: "draft",
      version: "1.0",
      tags,
    };

    this.documents.set(id, document);
    logger.info({ type: "project_document_created", docId: id }, `Documento creado: ${title}`);
    return document;
  }

  updateDocument(docId: string, content: string, version: string): ProjectDocument | null {
    const document = this.documents.get(docId);
    if (!document) return null;

    document.content = content;
    document.lastUpdated = new Date();
    document.version = version;

    this.documents.set(docId, document);
    logger.info({ type: "document_updated", docId }, `Documento actualizado v${version}`);
    return document;
  }

  approveDocument(docId: string): ProjectDocument | null {
    const document = this.documents.get(docId);
    if (!document) return null;

    document.status = "approved";
    this.documents.set(docId, document);
    logger.info({ type: "document_approved", docId }, `Documento aprobado`);
    return document;
  }

  archiveDocument(docId: string): ProjectDocument | null {
    const document = this.documents.get(docId);
    if (!document) return null;

    document.status = "archived";
    this.documents.set(docId, document);
    logger.info({ type: "document_archived", docId }, `Documento archivado`);
    return document;
  }

  createDocumentationIndex(
    projectName: string,
    projectId: string,
    documents: DocumentReference[],
  ): DocumentationIndex {
    const id = "index_" + Date.now();
    const index: DocumentationIndex = {
      id,
      projectName,
      projectId,
      createdDate: new Date(),
      documents,
      totalPages: documents.length * 10,
      completeness: 100,
      lastReviewed: new Date(),
    };

    this.documentationIndexes.set(id, index);
    this.documentationArchive.set(projectId, Array.from(this.documents.values()));

    logger.info(
      { type: "documentation_index_created", indexId: id },
      `Índice de documentación creado: ${projectName}`,
    );
    return index;
  }

  getDocumentsByType(
    type: "technical" | "business" | "operational" | "management",
  ): ProjectDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.type === type);
  }

  getDocumentsByAuthor(author: string): ProjectDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.author === author);
  }

  searchDocuments(keyword: string): ProjectDocument[] {
    return Array.from(this.documents.values()).filter(
      (d) =>
        d.title.toLowerCase().includes(keyword.toLowerCase()) ||
        d.content.toLowerCase().includes(keyword.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase())),
    );
  }

  getStatistics(): Record<string, any> {
    const documents = Array.from(this.documents.values());
    const indexes = Array.from(this.documentationIndexes.values());

    return {
      totalDocuments: documents.length,
      docsByType: {
        technical: documents.filter((d) => d.type === "technical").length,
        business: documents.filter((d) => d.type === "business").length,
        operational: documents.filter((d) => d.type === "operational").length,
        management: documents.filter((d) => d.type === "management").length,
      },
      docsByStatus: {
        draft: documents.filter((d) => d.status === "draft").length,
        review: documents.filter((d) => d.status === "review").length,
        approved: documents.filter((d) => d.status === "approved").length,
        archived: documents.filter((d) => d.status === "archived").length,
      },
      totalDocumentationIndexes: indexes.length,
      totalPages: documents.reduce((sum, d) => sum + (d.content.split("\n").length || 0), 0),
    };
  }

  generateDocumentationReport(): string {
    const stats = this.getStatistics();
    return `Project Documentation Report\nTotal Documents: ${stats.totalDocuments}\nDocumentation Indexes: ${stats.totalDocumentationIndexes}\nTotal Pages: ${stats.totalPages}`;
  }
}

let globalProjectDocumentationManager: ProjectDocumentationManager | null = null;

export function getProjectDocumentationManager(): ProjectDocumentationManager {
  if (!globalProjectDocumentationManager) {
    globalProjectDocumentationManager = new ProjectDocumentationManager();
  }
  return globalProjectDocumentationManager;
}
