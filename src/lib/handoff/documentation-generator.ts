/**
 * Documentation Generator Manager
 * Semana 48, Tarea 48.1: Documentation Generator
 */

import { logger } from "@/lib/monitoring";

export interface DocumentationTemplate {
  id: string;
  name: string;
  format: "markdown" | "html" | "pdf";
  sections: string[];
  createdAt: Date;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  title: string;
  content: string;
  generatedAt: Date;
  version: string;
}

export class DocumentationGeneratorManager {
  private templates: Map<string, DocumentationTemplate> = new Map();
  private documents: Map<string, GeneratedDocument> = new Map();

  constructor() {
    logger.debug({ type: "doc_gen_init" }, "Documentation Generator Manager inicializado");
  }

  createTemplate(name: string, format: string, sections: string[]): DocumentationTemplate {
    const template: DocumentationTemplate = {
      id: `tmpl_${Date.now()}`,
      name,
      format: format as any,
      sections,
      createdAt: new Date(),
    };
    this.templates.set(template.id, template);
    logger.info({ type: "template_created" }, `Template: ${name}`);
    return template;
  }

  generateDocument(templateId: string, title: string, version: string): GeneratedDocument {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        id: `doc_${Date.now()}`,
        templateId,
        title,
        content: "",
        generatedAt: new Date(),
        version,
      };
    }

    const document: GeneratedDocument = {
      id: `doc_${Date.now()}`,
      templateId,
      title,
      content: `# ${title}\n\n${template.sections.map((s) => `## ${s}\n\nContent for ${s}`).join("\n\n")}`,
      generatedAt: new Date(),
      version,
    };
    this.documents.set(document.id, document);
    logger.info({ type: "document_generated" }, `Doc: ${title}`);
    return document;
  }

  getStatistics() {
    return {
      totalTemplates: this.templates.size,
      generatedDocuments: this.documents.size,
    };
  }
}

let globalDocGenManager: DocumentationGeneratorManager | null = null;

export function getDocumentationGeneratorManager(): DocumentationGeneratorManager {
  if (!globalDocGenManager) {
    globalDocGenManager = new DocumentationGeneratorManager();
  }
  return globalDocGenManager;
}
