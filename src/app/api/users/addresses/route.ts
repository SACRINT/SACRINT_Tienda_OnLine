// User Addresses API
// GET /api/users/addresses - Get all addresses for current user
// POST /api/users/addresses - Create new address for current user

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getUserAddresses, createUserAddress } from '@/lib/db/users'
import { db } from '@/lib/db/client'
import { z } from 'zod'

// Validation schema for creating/updating addresses
const CreateAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  street: z.string().min(5, 'Street address must be at least 5 characters').max(255),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().min(2, 'State must be at least 2 characters').max(100),
  postalCode: z.string().min(4, 'Postal code must be at least 4 characters').max(20),
  country: z.string().min(2, 'Country must be at least 2 characters').max(2).default('MX'),
  isDefault: z.boolean().optional().default(false),
})

/**
 * GET /api/users/addresses
 * Returns all addresses for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { id: userId } = session.user

    // Get user addresses
    const addresses = await getUserAddresses(userId)

    return NextResponse.json({
      addresses: addresses.map((address: any) => ({
        id: address.id,
        name: address.name,
        email: address.email,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      })),
      total: addresses.length,
    })
  } catch (error) {
    console.error('[ADDRESSES] GET error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/addresses
 * Creates a new address for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { id: userId } = session.user

    // Parse and validate request body
    const body = await req.json()
    const validation = CreateAddressSchema.safeParse(body)

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

    // If this is set as default, unset other default addresses
    if (isDefault) {
      const existingAddresses = await getUserAddresses(userId)
      const defaultAddress = existingAddresses.find((addr: any) => addr.isDefault)

      if (defaultAddress) {
        await db.address.update({
          where: { id: defaultAddress.id },
          data: { isDefault: false },
        })
      }
    }

    // Create new address
    const address = await createUserAddress({
      userId,
      fullName,
      email,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    })

    console.log(`[ADDRESSES] Created new address ${address.id} for user ${userId}`)

    return NextResponse.json(
      {
        message: 'Address created successfully',
        address: {
          id: address.id,
          name: address.name,
          email: address.email,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[ADDRESSES] POST error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
