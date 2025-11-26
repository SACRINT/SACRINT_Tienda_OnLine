/**
 * Staff & User Management
 * Semana 40, Tarea 40.2: Staff & User Management
 */

import { logger } from '@/lib/monitoring'

export type StaffRole = 'admin' | 'manager' | 'operator' | 'viewer'
export type StaffStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface StaffMember {
  id: string
  email: string
  name: string
  role: StaffRole
  status: StaffStatus
  department: string
  permissions: string[]
  joinDate: Date
  lastActive: Date
  metadata?: Record<string, any>
}

export interface StaffInvitation {
  id: string
  email: string
  role: StaffRole
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  accepted: boolean
  acceptedAt?: Date
}

export interface StaffActivity {
  id: string
  staffId: string
  action: string
  timestamp: Date
  details?: Record<string, any>
}

export class StaffManagementManager {
  private staff: Map<string, StaffMember> = new Map()
  private invitations: Map<string, StaffInvitation> = new Map()
  private activity: StaffActivity[] = []

  constructor() {
    logger.debug({ type: 'staff_management_init' }, 'Staff Management Manager inicializado')
  }

  /**
   * Invitar staff
   */
  inviteStaff(email: string, role: StaffRole, invitedBy: string): StaffInvitation {
    try {
      const invitation: StaffInvitation = {
        id: `inv_${Date.now()}`,
        email,
        role,
        invitedBy,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        accepted: false,
      }

      this.invitations.set(invitation.id, invitation)

      logger.info({ type: 'staff_invited', email, role }, `Staff invitado: ${email}`)

      return invitation
    } catch (error) {
      logger.error({ type: 'invitation_error', email, error: String(error) }, 'Error al invitar staff')
      throw error
    }
  }

  /**
   * Aceptar invitación
   */
  acceptInvitation(invitationId: string, staffId: string): StaffMember | null {
    const invitation = this.invitations.get(invitationId)
    if (!invitation || invitation.expiresAt < new Date()) {
      return null
    }

    const staff: StaffMember = {
      id: staffId,
      email: invitation.email,
      name: invitation.email.split('@')[0],
      role: invitation.role,
      status: 'active',
      department: '',
      permissions: this.getDefaultPermissions(invitation.role),
      joinDate: new Date(),
      lastActive: new Date(),
    }

    this.staff.set(staffId, staff)
    invitation.accepted = true
    invitation.acceptedAt = new Date()

    logger.info({ type: 'invitation_accepted', email: invitation.email, staffId }, `Invitación aceptada`)

    return staff
  }

  /**
   * Obtener permisos por defecto según rol
   */
  private getDefaultPermissions(role: StaffRole): string[] {
    const permissionMap: Record<StaffRole, string[]> = {
      admin: ['view_all', 'create', 'edit', 'delete', 'manage_staff', 'audit_logs'],
      manager: ['view_all', 'create', 'edit', 'manage_reports'],
      operator: ['view_assigned', 'create', 'edit_own'],
      viewer: ['view_assigned'],
    }

    return permissionMap[role] || []
  }

  /**
   * Obtener staff member
   */
  getStaffMember(staffId: string): StaffMember | null {
    return this.staff.get(staffId) || null
  }

  /**
   * Obtener todo el staff
   */
  getAllStaff(status?: StaffStatus): StaffMember[] {
    const staff = Array.from(this.staff.values())
    return status ? staff.filter((s) => s.status === status) : staff
  }

  /**
   * Actualizar staff
   */
  updateStaff(staffId: string, updates: Partial<StaffMember>): StaffMember | null {
    const staff = this.getStaffMember(staffId)
    if (!staff) return null

    Object.assign(staff, updates)
    staff.lastActive = new Date()

    logger.debug({ type: 'staff_updated', staffId }, `Staff actualizado: ${staffId}`)

    return staff
  }

  /**
   * Suspender staff
   */
  suspendStaff(staffId: string, reason?: string): boolean {
    const staff = this.getStaffMember(staffId)
    if (!staff) return false

    staff.status = 'suspended'

    this.recordActivity(staffId, 'suspended', { reason })
    logger.warn({ type: 'staff_suspended', staffId, reason }, `Staff suspendido: ${staffId}`)

    return true
  }

  /**
   * Reactivar staff
   */
  reactivateStaff(staffId: string): boolean {
    const staff = this.getStaffMember(staffId)
    if (!staff) return false

    staff.status = 'active'

    this.recordActivity(staffId, 'reactivated', {})
    logger.info({ type: 'staff_reactivated', staffId }, `Staff reactivado: ${staffId}`)

    return true
  }

  /**
   * Registrar actividad
   */
  private recordActivity(staffId: string, action: string, details?: Record<string, any>): void {
    const activity: StaffActivity = {
      id: `act_${Date.now()}`,
      staffId,
      action,
      timestamp: new Date(),
      details,
    }

    this.activity.push(activity)

    // Limitar historial
    if (this.activity.length > 10000) {
      this.activity = this.activity.slice(-10000)
    }
  }

  /**
   * Obtener historial de actividad
   */
  getActivityHistory(staffId: string, limit: number = 50): StaffActivity[] {
    return this.activity.filter((a) => a.staffId === staffId).slice(-limit)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalStaff: number
    byRole: Record<StaffRole, number>
    byStatus: Record<StaffStatus, number>
    activeInvitations: number
  } {
    const staff = Array.from(this.staff.values())
    const byRole: Record<StaffRole, number> = { admin: 0, manager: 0, operator: 0, viewer: 0 }
    const byStatus: Record<StaffStatus, number> = { active: 0, inactive: 0, suspended: 0, pending: 0 }

    for (const member of staff) {
      byRole[member.role]++
      byStatus[member.status]++
    }

    const activeInvitations = Array.from(this.invitations.values()).filter((i) => !i.accepted && i.expiresAt > new Date()).length

    return {
      totalStaff: staff.length,
      byRole,
      byStatus,
      activeInvitations,
    }
  }
}

let globalStaffManagementManager: StaffManagementManager | null = null

export function initializeStaffManagementManager(): StaffManagementManager {
  if (!globalStaffManagementManager) {
    globalStaffManagementManager = new StaffManagementManager()
  }
  return globalStaffManagementManager
}

export function getStaffManagementManager(): StaffManagementManager {
  if (!globalStaffManagementManager) {
    return initializeStaffManagementManager()
  }
  return globalStaffManagementManager
}
