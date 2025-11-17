// User Address Detail API
// PATCH /api/users/addresses/[id] - Update address
// DELETE /api/users/addresses/[id] - Delete address

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db/client'
import { z } from 'zod'

// Validation schema for updating addresses
const UpdateAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  street: z.string().min(5, 'Street address must be at least 5 characters').max(255).optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100).optional(),
  state: z.string().min(2, 'State must be at least 2 characters').max(100).optional(),
  postalCode: z.string().min(4, 'Postal code must be at least 4 characters').max(20).optional(),
  country: z.string().min(2, 'Country must be at least 2 characters').max(2).optional(),
  isDefault: z.boolean().optional(),
})

/**
 * PATCH /api/users/addresses/[id]
 * Updates an address
 * Users can only update their own addresses
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { id: userId } = session.user
    const addressId = params.id

    // Check if address exists and belongs to user
    const existingAddress = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - This address does not belong to you' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = UpdateAddressSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      fullName,
      email,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = validation.data

    // If this is being set as default, unset other default addresses
    if (isDefault === true && !existingAddress.isDefault) {
      await db.address.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      })
    }

    // Update address
    const updatedAddress = await db.address.update({
      where: { id: addressId },
      data: {
        ...(fullName && { name: fullName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    console.log(`[ADDRESSES] Updated address ${addressId} for user ${userId}`)

    return NextResponse.json({
      message: 'Address updated successfully',
      address: {
        id: updatedAddress.id,
        name: updatedAddress.name,
        email: updatedAddress.email,
        phone: updatedAddress.phone,
        street: updatedAddress.street,
        city: updatedAddress.city,
        state: updatedAddress.state,
        postalCode: updatedAddress.postalCode,
        country: updatedAddress.country,
        isDefault: updatedAddress.isDefault,
      },
    })
  } catch (error) {
    console.error('[ADDRESSES] PATCH error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/addresses/[id]
 * Deletes an address
 * Users can only delete their own addresses
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { id: userId } = session.user
    const addressId = params.id

    // Check if address exists and belongs to user
    const existingAddress = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - This address does not belong to you' },
        { status: 403 }
      )
    }

    // Delete address
    await db.address.delete({
      where: { id: addressId },
    })

    console.log(`[ADDRESSES] Deleted address ${addressId} for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    })
  } catch (error) {
    console.error('[ADDRESSES] DELETE error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
