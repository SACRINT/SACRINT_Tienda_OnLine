/**
 * Permission Matrix Management
 * Semana 40, Tarea 40.8: Permission Matrix Management
 */

import { logger } from '@/lib/monitoring'

export interface PermissionMatrix {
  id: string
  roleId: string
  permissions: Record<string, Record<string, boolean>>
  createdAt: Date
  updatedAt: Date
}

export class PermissionMatrixManager {
  private matrices: Map<string, PermissionMatrix> = new Map()

  constructor() {
    logger.debug({ type: 'permission_matrix_init' }, 'Permission Matrix Manager inicializado')
  }

  /**
   * Crear matriz
   */
  createMatrix(roleId: string, permissions: Record<string, Record<string, boolean>>): PermissionMatrix {
    const matrix: PermissionMatrix = {
      id: `matrix_${Date.now()}`,
      roleId,
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.matrices.set(matrix.id, matrix)
    return matrix
  }

  /**
   * Verificar permiso
   */
  hasPermission(roleId: string, resource: string, action: string): boolean {
    const matrices = Array.from(this.matrices.values()).filter((m) => m.roleId === roleId)

    for (const matrix of matrices) {
      if (matrix.permissions[resource]?.[action] === true) {
        return true
      }
    }

    return false
  }

  /**
   * Obtener matriz
   */
  getMatrix(matrixId: string): PermissionMatrix | null {
    return this.matrices.get(matrixId) || null
  }

  /**
   * Actualizar permiso
   */
  setPermission(matrixId: string, resource: string, action: string, allowed: boolean): boolean {
    const matrix = this.getMatrix(matrixId)
    if (!matrix) return false

    if (!matrix.permissions[resource]) {
      matrix.permissions[resource] = {}
    }

    matrix.permissions[resource][action] = allowed
    matrix.updatedAt = new Date()

    return true
  }
}

let globalPermissionMatrixManager: PermissionMatrixManager | null = null

export function initializePermissionMatrixManager(): PermissionMatrixManager {
  if (!globalPermissionMatrixManager) {
    globalPermissionMatrixManager = new PermissionMatrixManager()
  }
  return globalPermissionMatrixManager
}

export function getPermissionMatrixManager(): PermissionMatrixManager {
  if (!globalPermissionMatrixManager) {
    return initializePermissionMatrixManager()
  }
  return globalPermissionMatrixManager
}
