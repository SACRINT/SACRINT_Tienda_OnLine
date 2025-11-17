// Coupon DAL Tests
// Unit tests for coupon management functions

import {
  getCouponsByTenant,
  getCouponById,
  getCouponByCode,
  validateCoupon,
  calculateDiscount,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  incrementCouponUsage,
  getCouponStats,
} from '../coupons'
import { db } from '../client'
import { ensureTenantAccess } from '../tenant'

// Mock dependencies
jest.mock('../client', () => ({
  db: {
    coupon: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('../tenant', () => ({
  ensureTenantAccess: jest.fn(),
}))

describe('Coupon DAL', () => {
  const mockTenantId = 'tenant-123'
  const mockCouponId = 'coupon-456'
  const mockCoupon = {
    id: mockCouponId,
    code: 'SAVE20',
    type: 'PERCENTAGE',
    discount: 20,
    maxDiscount: 100,
    minPurchase: 50,
    maxUses: 100,
    usedCount: 10,
    isActive: true,
    expiresAt: new Date('2025-12-31'),
    description: 'Test coupon',
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCouponsByTenant', () => {
    it('should retrieve all coupons for a tenant', async () => {
      ;(db.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon])

      const result = await getCouponsByTenant(mockTenantId)

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId)
      expect(db.coupon.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: mockTenantId }),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual([mockCoupon])
    })

    it('should filter by status', async () => {
      ;(db.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon])

      await getCouponsByTenant(mockTenantId, { status: 'ACTIVE' })

      expect(db.coupon.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          isActive: true,
        }),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by type', async () => {
      ;(db.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon])

      await getCouponsByTenant(mockTenantId, { type: 'PERCENTAGE' })

      expect(db.coupon.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          type: 'PERCENTAGE',
        }),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should exclude expired coupons by default', async () => {
      ;(db.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon])

      await getCouponsByTenant(mockTenantId)

      expect(db.coupon.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          expiresAt: { gte: expect.any(Date) },
        }),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await validateCoupon(mockTenantId, 'SAVE20', 100)

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId)
      expect(result).toEqual(mockCoupon)
    })

    it('should throw error for inactive coupon', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(validateCoupon(mockTenantId, 'INVALID', 100)).rejects.toThrow(
        'Coupon not found or inactive'
      )
    })

    it('should throw error for expired coupon', async () => {
      const expiredCoupon = {
        ...mockCoupon,
        expiresAt: new Date('2020-01-01'),
      }
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(expiredCoupon)

      await expect(validateCoupon(mockTenantId, 'SAVE20', 100)).rejects.toThrow(
        'Coupon has expired'
      )
    })

    it('should throw error when usage limit reached', async () => {
      const fullyCoupon = {
        ...mockCoupon,
        maxUses: 10,
        usedCount: 10,
      }
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(fullyCoupon)

      await expect(validateCoupon(mockTenantId, 'SAVE20', 100)).rejects.toThrow(
        'Coupon usage limit reached'
      )
    })

    it('should throw error when order total below minimum', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon)

      await expect(validateCoupon(mockTenantId, 'SAVE20', 30)).rejects.toThrow(
        'Minimum purchase amount is $50'
      )
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const coupon = { type: 'PERCENTAGE', discount: 20, maxDiscount: null }
      const result = calculateDiscount(coupon, 100)
      expect(result).toBe(20) // 20% of 100
    })

    it('should apply max discount limit for percentage', () => {
      const coupon = { type: 'PERCENTAGE', discount: 20, maxDiscount: 15 }
      const result = calculateDiscount(coupon, 100)
      expect(result).toBe(15) // Limited to $15
    })

    it('should calculate fixed amount discount correctly', () => {
      const coupon = { type: 'FIXED_AMOUNT', discount: 25, maxDiscount: null }
      const result = calculateDiscount(coupon, 100)
      expect(result).toBe(25)
    })

    it('should not exceed order total for fixed amount', () => {
      const coupon = { type: 'FIXED_AMOUNT', discount: 150, maxDiscount: null }
      const result = calculateDiscount(coupon, 100)
      expect(result).toBe(100) // Cannot exceed order total
    })

    it('should round to 2 decimal places', () => {
      const coupon = { type: 'PERCENTAGE', discount: 15.5, maxDiscount: null }
      const result = calculateDiscount(coupon, 100)
      expect(result).toBe(15.5)
    })
  })

  describe('createCoupon', () => {
    const couponData = {
      code: 'NEW20',
      type: 'PERCENTAGE' as const,
      discount: 20,
      maxDiscount: null,
      minPurchase: null,
      maxUses: null,
      expiresAt: null,
      description: null,
    }

    it('should create a new coupon', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(null)
      ;(db.coupon.create as jest.Mock).mockResolvedValue({
        ...couponData,
        id: 'new-coupon-id',
        tenantId: mockTenantId,
        isActive: true,
        usedCount: 0,
      })

      const result = await createCoupon(mockTenantId, couponData)

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId)
      expect(db.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'NEW20',
          tenantId: mockTenantId,
          isActive: true,
          usedCount: 0,
        }),
      })
      expect(result).toBeDefined()
    })

    it('should throw error if code already exists', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon)

      await expect(createCoupon(mockTenantId, couponData)).rejects.toThrow(
        'Coupon code already exists'
      )
    })

    it('should convert code to uppercase', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(null)
      ;(db.coupon.create as jest.Mock).mockResolvedValue({})

      await createCoupon(mockTenantId, { ...couponData, code: 'save20' })

      expect(db.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'SAVE20',
        }),
      })
    })
  })

  describe('updateCoupon', () => {
    it('should update an existing coupon', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon)
      ;(db.coupon.update as jest.Mock).mockResolvedValue({
        ...mockCoupon,
        isActive: false,
      })

      const result = await updateCoupon(mockTenantId, mockCouponId, {
        isActive: false,
      })

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId)
      expect(db.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCouponId },
        data: { isActive: false },
      })
    })

    it('should throw error if coupon not found', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        updateCoupon(mockTenantId, mockCouponId, { isActive: false })
      ).rejects.toThrow('Coupon not found or does not belong to tenant')
    })
  })

  describe('deleteCoupon', () => {
    it('should delete a coupon', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon)
      ;(db.coupon.delete as jest.Mock).mockResolvedValue(mockCoupon)

      await deleteCoupon(mockTenantId, mockCouponId)

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId)
      expect(db.coupon.delete).toHaveBeenCalledWith({ where: { id: mockCouponId } })
    })

    it('should throw error if coupon not found', async () => {
      ;(db.coupon.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(deleteCoupon(mockTenantId, mockCouponId)).rejects.toThrow(
        'Coupon not found or does not belong to tenant'
      )
    })
  })

  describe('incrementCouponUsage', () => {
    it('should increment usage count', async () => {
      ;(db.coupon.update as jest.Mock).mockResolvedValue({
        ...mockCoupon,
        usedCount: 11,
      })

      await incrementCouponUsage(mockCouponId)

      expect(db.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCouponId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      })
    })
  })
})
