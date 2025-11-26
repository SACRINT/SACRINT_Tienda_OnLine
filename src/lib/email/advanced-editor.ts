/**
 * Advanced Template Editor y Drag-Drop
 * Semana 32, Tarea 32.9: Editor de plantillas con drag-drop y vista previa
 */

import { logger } from '@/lib/monitoring'

export interface TemplateElement {
  id: string
  type: 'text' | 'button' | 'image' | 'section' | 'column'
  position: number
  width?: number
  height?: number
  content?: string
  styling: Record<string, any>
  nested?: TemplateElement[]
}

export class AdvancedTemplateEditor {
  private templates: Map<string, { elements: TemplateElement[]; html: string }> = new Map()

  constructor() {
    logger.debug({ type: 'advanced_editor_init' }, 'Advanced Template Editor inicializado')
  }

  createTemplate(templateId: string): void {
    this.templates.set(templateId, {
      elements: [],
      html: '',
    })

    logger.debug({ type: 'template_canvas_created', templateId }, 'Canvas de plantilla creado')
  }

  addElement(templateId: string, element: TemplateElement): TemplateElement {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template no encontrado')

    template.elements.push(element)
    logger.debug({ type: 'element_added', templateId }, 'Elemento agregado al template')

    return element
  }

  reorderElements(templateId: string, elementIds: string[]): void {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template no encontrado')

    const elementMap = new Map(template.elements.map((e) => [e.id, e]))
    template.elements = elementIds.map((id) => elementMap.get(id)!).filter(Boolean)

    logger.debug({ type: 'elements_reordered', templateId }, 'Elementos reordenados')
  }

  updateElement(templateId: string, elementId: string, updates: Partial<TemplateElement>): void {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template no encontrado')

    const element = template.elements.find((e) => e.id === elementId)
    if (!element) throw new Error('Elemento no encontrado')

    Object.assign(element, updates)

    logger.debug({ type: 'element_updated', templateId, elementId }, 'Elemento actualizado')
  }

  deleteElement(templateId: string, elementId: string): void {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template no encontrado')

    template.elements = template.elements.filter((e) => e.id !== elementId)

    logger.debug({ type: 'element_deleted', templateId, elementId }, 'Elemento eliminado')
  }

  previewHTML(templateId: string): string {
    const template = this.templates.get(templateId)
    if (!template) return ''

    let html = '<div style="max-width: 600px; margin: 0 auto;">'

    for (const element of template.elements) {
      html += this.renderElement(element)
    }

    html += '</div>'
    template.html = html

    return html
  }

  private renderElement(element: TemplateElement): string {
    const style = Object.entries(element.styling)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')

    const styleAttr = style ? `style="${style}"` : ''

    switch (element.type) {
      case 'text':
        return `<div ${styleAttr}>${element.content || ''}</div>`

      case 'button':
        return `<a href="#" class="button" ${styleAttr}>${element.content || 'Click here'}</a>`

      case 'image':
        return `<img src="${element.content || ''}" ${styleAttr} alt="image">`

      case 'section':
        let sectionHTML = `<section ${styleAttr}>`
        if (element.nested) {
          sectionHTML += element.nested.map((e) => this.renderElement(e)).join('')
        }
        sectionHTML += '</section>'
        return sectionHTML

      case 'column':
        return `<div class="column" ${styleAttr}>${element.content || ''}</div>`

      default:
        return `<div ${styleAttr}>${element.content || ''}</div>`
    }
  }

  exportAsHTML(templateId: string): string {
    const template = this.templates.get(templateId)
    if (!template) return ''

    return template.html
  }
}

let globalEditor: AdvancedTemplateEditor | null = null

export function initializeAdvancedTemplateEditor(): AdvancedTemplateEditor {
  if (!globalEditor) {
    globalEditor = new AdvancedTemplateEditor()
  }
  return globalEditor
}

export function getAdvancedTemplateEditor(): AdvancedTemplateEditor {
  if (!globalEditor) {
    return initializeAdvancedTemplateEditor()
  }
  return globalEditor
}
