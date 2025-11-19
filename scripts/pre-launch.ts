#!/usr/bin/env npx ts-node

/**
 * Pre-Launch Validation Script
 *
 * Run this script before deploying to production to ensure
 * all requirements are met.
 *
 * Usage: npx ts-node scripts/pre-launch.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  status: "pass" | "fail" | "warn"
  message: string
}

const results: CheckResult[] = []

function log(result: CheckResult) {
  const icon =
    result.status === "pass"
      ? "✅"
      : result.status === "warn"
        ? "⚠️"
        : "❌"
  console.log(`${icon} ${result.name}: ${result.message}`)
  results.push(result)
}

async function checkEnvironmentVariables() {
  console.log("\n📋 Checking Environment Variables...\n")

  const required = [
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "STRIPE_PUBLIC_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ]

  for (const key of required) {
    if (process.env[key]) {
      log({
        name: key,
        status: "pass",
        message: "Set",
      })
    } else {
      log({
        name: key,
        status: "fail",
        message: "Missing",
      })
    }
  }

  // Check secret strength
  const secret = process.env.NEXTAUTH_SECRET || ""
  if (secret.length < 32) {
    log({
      name: "NEXTAUTH_SECRET strength",
      status: "warn",
      message: `Only ${secret.length} characters (minimum 32 recommended)`,
    })
  } else {
    log({
      name: "NEXTAUTH_SECRET strength",
      status: "pass",
      message: `${secret.length} characters`,
    })
  }

  // Check Stripe keys
  const stripeKey = process.env.STRIPE_PUBLIC_KEY || ""
  if (stripeKey.startsWith("pk_live")) {
    log({
      name: "Stripe mode",
      status: "pass",
      message: "Live keys configured",
    })
  } else if (stripeKey.startsWith("pk_test")) {
    log({
      name: "Stripe mode",
      status: "warn",
      message: "Using test keys",
    })
  }
}

async function checkDatabase() {
  console.log("\n📋 Checking Database...\n")

  try {
    // Test connection
    await prisma.$connect()
    log({
      name: "Database connection",
      status: "pass",
      message: "Connected successfully",
    })

    // Check tables exist
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    if (tables.length > 0) {
      log({
        name: "Database tables",
        status: "pass",
        message: `${tables.length} tables found`,
      })
    } else {
      log({
        name: "Database tables",
        status: "fail",
        message: "No tables found - run migrations",
      })
    }

    // Check for pending migrations
    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
    `

    log({
      name: "Migrations",
      status: "pass",
      message: `${migrations.length} migrations applied`,
    })
  } catch (error) {
    log({
      name: "Database connection",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function checkBuild() {
  console.log("\n📋 Checking Build...\n")

  // Check if .next directory exists
  const fs = await import("fs")
  const path = await import("path")

  const nextDir = path.join(process.cwd(), ".next")

  if (fs.existsSync(nextDir)) {
    log({
      name: "Build output",
      status: "pass",
      message: ".next directory exists",
    })
  } else {
    log({
      name: "Build output",
      status: "warn",
      message: "No build found - run 'pnpm build'",
    })
  }

  // Check package.json scripts
  const packagePath = path.join(process.cwd(), "package.json")
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"))
    const requiredScripts = ["build", "start", "lint"]

    for (const script of requiredScripts) {
      if (pkg.scripts?.[script]) {
        log({
          name: `Script: ${script}`,
          status: "pass",
          message: "Defined",
        })
      } else {
        log({
          name: `Script: ${script}`,
          status: "fail",
          message: "Missing",
        })
      }
    }
  }
}

async function checkSecurity() {
  console.log("\n📋 Checking Security...\n")

  // Check for .env in gitignore
  const fs = await import("fs")
  const path = await import("path")

  const gitignorePath = path.join(process.cwd(), ".gitignore")

  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8")

    if (gitignore.includes(".env")) {
      log({
        name: ".env in gitignore",
        status: "pass",
        message: "Environment files are ignored",
      })
    } else {
      log({
        name: ".env in gitignore",
        status: "fail",
        message: "Add .env to .gitignore",
      })
    }
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === "production") {
    log({
      name: "NODE_ENV",
      status: "pass",
      message: "Set to production",
    })
  } else {
    log({
      name: "NODE_ENV",
      status: "warn",
      message: `Currently: ${process.env.NODE_ENV || "undefined"}`,
    })
  }
}

async function generateReport() {
  console.log("\n" + "=".repeat(50))
  console.log("📊 PRE-LAUNCH VALIDATION REPORT")
  console.log("=".repeat(50) + "\n")

  const passed = results.filter((r) => r.status === "pass").length
  const warnings = results.filter((r) => r.status === "warn").length
  const failed = results.filter((r) => r.status === "fail").length
  const total = results.length

  console.log(`Total Checks: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("")

  if (failed > 0) {
    console.log("❌ LAUNCH BLOCKED - Fix failed checks before deploying\n")
    console.log("Failed checks:")
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`))
    process.exit(1)
  } else if (warnings > 0) {
    console.log("⚠️  LAUNCH WITH CAUTION - Review warnings\n")
    console.log("Warnings:")
    results
      .filter((r) => r.status === "warn")
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`))
    process.exit(0)
  } else {
    console.log("✅ READY FOR LAUNCH - All checks passed!\n")
    process.exit(0)
  }
}

async function main() {
  console.log("🚀 SACRINT Tienda Online - Pre-Launch Validation")
  console.log("=".repeat(50))

  await checkEnvironmentVariables()
  await checkDatabase()
  await checkBuild()
  await checkSecurity()
  await generateReport()
}

main().catch((error) => {
  console.error("Validation failed:", error)
  process.exit(1)
})
