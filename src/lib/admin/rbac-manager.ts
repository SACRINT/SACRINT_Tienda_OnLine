/**
 * Role-Based Access Control Enhancement
 * Semana 40, Tarea 40.3: Role-Based Access Control Enhancement
 */

import { logger } from '@/lib/monitoring'

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AccessPolicy {
  roleId: string
  resource: string
  action: 'read' | 'write' | 'delete' | 'admin'
  allowed: boolean
}

export class RBACManager {
  private permissions: Map<string, Permission> = new Map()
  private roles: Map<string, Role> = new Map()
  private policies: Map<string, AccessPolicy> = new Map()
  private userRoles: Map<string, string[]> = new Map() // userId -> roleIds

  constructor() {
    logger.debug({ type: 'rbac_manager_init' }, 'RBAC Manager inicializado')
    this.initializeDefaultPermissions()
  }

  /**
   * Inicializar permisos por defecto
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      { id: 'view_dashboard', name: 'Ver Dashboard', description: 'Acceso al dashboard', category: 'dashboard' },
      { id: 'manage_staff', name: 'Gestionar Staff', description: 'Crear y modificar staff', category: 'staff' },
      { id: 'view_reports', name: 'Ver Reportes', description: 'Acceso a reportes', category: 'reports' },
      { id: 'manage_products', name: 'Gestionar Productos', description: 'CRUD de productos', category: 'products' },
      { id: 'manage_orders', name: 'Gestionar Órdenes', description: 'Manejo de órdenes', category: 'orders' },
      { id: 'view_analytics', name: 'Ver Analytics', description: 'Acceso a analytics', category: 'analytics' },
      { id: 'manage_users', name: 'Gestionar Usuarios', description: 'Admin de usuarios', category: 'users' },
    ]

    for (const perm of defaultPermissions) {
      this.permissions.set(perm.id, perm)
    }
  }

  /**
   * Crear rol
   */
  createRole(name: string, permissions: string[]): Role {
    const role: Role = {
      id: `role_${Date.now()}`,
      name,
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.roles.set(role.id, role)
    logger.info({ type: 'role_created', roleId: role.id, name }, `Rol creado: ${name}`)

    return role
  }

  /**
   * Asignar rol a usuario
   */
  assignRoleToUser(userId: string, roleId: string): boolean {
    if (!this.roles.has(roleId)) return false

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, [])
    }

    const roles = this.userRoles.get(userId)!
    if (!roles.includes(roleId)) {
      roles.push(roleId)
      logger.debug({ type: 'role_assigned', userId, roleId }, `Rol asignado a usuario`)
      return true
    }

    return false
  }

  /**
   * Verificar permiso
   */
  hasPermission(userId: string, permissionId: string): boolean {
    const userRoles = this.userRoles.get(userId) || []

    for (const roleId of userRoles) {
      const role = this.roles.get(roleId)
      if (role && role.permissions.includes(permissionId)) {
        return true
      }
    }

    return false
  }

  /**
   * Verificar acceso a recurso
   */
  checkResourceAccess(userId: string, resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean {
    const userRoles = this.userRoles.get(userId) || []

    for (const roleId of userRoles) {
      const policy = this.policies.get(`${roleId}:${resource}:${action}`)
      if (policy && policy.allowed) {
        return true
      }
    }

    return false
  }

  /**
   * Obtener permisos del usuario
   */
  getUserPermissions(userId: string): Permission[] {
    const userRoles = this.userRoles.get(userId) || []
    const permissionIds = new Set<string>()

    for (const roleId of userRoles) {
      const role = this.roles.get(roleId)
      if (role) {
        role.permissions.forEach((p) => permissionIds.add(p))
      }
    }

    return Array.from(permissionIds)
      .map((id) => this.permissions.get(id))
      .filter((p): p is Permission => p !== null)
  }

  /**
   * Obtener rol
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null
  }

  /**
   * Actualizar rol
   */
  updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const role = this.getRole(roleId)
    if (!role) return null

    Object.assign(role, updates)
    role.updatedAt = new Date()

    return role
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalRoles: number; totalPermissions: number; totalPolicies: number; usersWithRoles: number } {
    return {
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      totalPolicies: this.policies.size,
      usersWithRoles: this.userRoles.size,
    }
  }
}

let globalRBACManager: RBACManager | null = null

export function initializeRBACManager(): RBACManager {
  if (!globalRBACManager) {
    globalRBACManager = new RBACManager()
  }
  return globalRBACManager
}

export function getRBACManager(): RBACManager {
  if (!globalRBACManager) {
    return initializeRBACManager()
  }
  return globalRBACManager
}
