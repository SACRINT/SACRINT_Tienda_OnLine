# Development Guide

## Prerequisites

- Node.js 18+
- pnpm or npm
- PostgreSQL 15+ (or Neon account)
- Git

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
cd SACRINT_Tienda_OnLine
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure required variables:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Stripe
STRIPE_PUBLIC_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Email
RESEND_API_KEY="re_xxx"

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed data
pnpm prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (store)/           # Public store pages
│   ├── (dashboard)/       # Admin dashboard
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── product/           # Product components
│   ├── checkout/          # Checkout flow
│   ├── shipping/          # Shipping components
│   ├── marketing/         # Marketing tools
│   ├── coupons/           # Coupon components
│   ├── wishlist/          # Wishlist components
│   ├── notifications/     # Notification system
│   ├── analytics/         # Analytics charts
│   ├── image/             # Optimized images
│   ├── seo/               # SEO components
│   └── performance/       # Skeletons, errors
├── lib/
│   ├── auth/              # Authentication logic
│   ├── db/                # Prisma client
│   ├── security/          # Security utilities
│   ├── shipping/          # Shipping service
│   ├── payments/          # Payment processing
│   ├── coupons/           # Coupon validation
│   ├── wishlist/          # Wishlist service
│   ├── notifications/     # Notification service
│   ├── seo/               # SEO utilities
│   ├── image/             # Image utilities
│   ├── performance/       # Performance utilities
│   └── testing/           # Test helpers
├── __tests__/             # Test files
└── prisma/
    ├── schema.prisma      # Database schema
    └── migrations/        # Database migrations
```

---

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: Add my feature"

# Push and create PR
git push origin feature/my-feature
```

### Commit Convention

Follow Conventional Commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructure
- `test:` Tests
- `chore:` Maintenance

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

---

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix lint errors
pnpm type-check       # TypeScript check
pnpm format           # Format with Prettier

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma migrate dev   # Run migrations
pnpm prisma studio    # Database GUI
pnpm prisma db push   # Push schema changes
```

---

## Code Style Guide

### TypeScript

- Enable strict mode
- Explicit return types for functions
- Use type inference when obvious
- Prefer interfaces over types

```typescript
// Good
interface Product {
  id: string
  name: string
  price: number
}

function getProduct(id: string): Product {
  // ...
}

// Avoid
type Product = {
  id: string
}
```

### React Components

- Use functional components
- Destructure props
- Co-locate styles with Tailwind

```tsx
interface ButtonProps {
  variant?: "primary" | "secondary"
  children: React.ReactNode
  onClick?: () => void
}

export function Button({
  variant = "primary",
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded",
        variant === "primary" && "bg-primary text-white",
        variant === "secondary" && "bg-muted"
      )}
    >
      {children}
    </button>
  )
}
```

### API Routes

- Validate input with Zod
- Use proper HTTP methods
- Return consistent responses

```typescript
import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

const schema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    // Process...

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from "vitest"
import { validateCoupon } from "@/lib/coupons"

describe("validateCoupon", () => {
  it("should validate percentage coupon", () => {
    const result = validateCoupon("DESCUENTO10", 500)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(50)
  })
})
```

### Component Tests

```tsx
import { render, screen } from "@/lib/testing/render"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("should render children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })
})
```

### Running Tests

```bash
# All tests
pnpm test

# Specific file
pnpm test wishlist

# With coverage
pnpm test:coverage
```

---

## Debugging

### VS Code Configuration

`.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Next.js: debug server",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

### Environment Variables

Check variables are loaded:

```typescript
console.log(process.env.DATABASE_URL)
```

### Prisma Studio

Visual database browser:

```bash
pnpm prisma studio
```

---

## Common Issues

### "Module not found"

Ensure path aliases are correct in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "CSRF token invalid"

Make sure cookies are enabled and not blocked.

### Database connection failed

Check `DATABASE_URL` format and network access.

### Stripe webhook fails

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Stripe API](https://stripe.com/docs/api)
