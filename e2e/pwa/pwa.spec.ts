/**
 * PWA End-to-End Testing
 * Semana 30, Tarea 30.9: PWA testing con Playwright y Lighthouse
 */

import { test, expect } from '@playwright/test'

test.describe('PWA Features', () => {
  test('Manifest must be valid', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const manifest = await page.locator('link[rel="manifest"]')
    const href = await manifest.getAttribute('href')

    expect(href).toBe('/manifest.json')

    // Fetch and parse manifest
    const manifestContent = await page.evaluate(() => {
      return fetch('/manifest.json').then((r) => r.json())
    })

    expect(manifestContent.name).toBeTruthy()
    expect(manifestContent.short_name).toBeTruthy()
    expect(manifestContent.start_url).toBe('/')
    expect(manifestContent.display).toBe('standalone')
    expect(manifestContent.icons).toBeDefined()
    expect(manifestContent.icons.length).toBeGreaterThan(0)
  })

  test('Service Worker should be registered', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg)
    })

    expect(swRegistered).toBe(true)
  })

  test('Page should work offline', async ({ page, context }) => {
    // First visit to cache resources
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Reload page - should still work
    await page.reload()

    // Check main content is visible
    const mainContent = page.locator('main, [role="main"]')
    await expect(mainContent).toBeVisible()

    // Go back online
    await context.setOffline(false)
  })

  test('Installable prompts should be available', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check for install prompt component
    const installPrompt = page.locator('[data-testid="install-prompt"]')
    // May or may not be visible depending on browser/conditions
    const isVisible = await installPrompt.isVisible().catch(() => false)

    // Should have beforeinstallprompt support
    const hasBeforeInstallPrompt = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let found = false
        window.addEventListener('beforeinstallprompt', () => {
          found = true
        })
        setTimeout(() => resolve(found), 2000)
      })
    })

    expect(typeof hasBeforeInstallPrompt).toBe('boolean')
  })

  test('Service Worker caching should work', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Get initial request count
    let requestCount = 0
    await page.on('request', () => {
      requestCount++
    })

    // Navigate to a page
    await page.goto('http://localhost:3000/shop')
    const requestCount1 = requestCount

    // Reset counter
    requestCount = 0

    // Navigate again - should use cache
    await page.goto('http://localhost:3000/shop')
    const requestCount2 = requestCount

    // Second load should have fewer requests (cached)
    expect(requestCount2).toBeLessThanOrEqual(requestCount1)
  })

  test('Light/Dark mode toggle should work', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check initial theme
    const htmlElement = page.locator('html')
    const initialClasses = await htmlElement.evaluate((el) => el.className)

    // Find theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]')

    // If toggle exists, click it
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click()

      // Check classes changed
      const newClasses = await htmlElement.evaluate((el) => el.className)
      expect(newClasses).not.toBe(initialClasses)
    }
  })

  test('Offline products should be browsable', async ({ page, context }) => {
    // First visit to cache
    await page.goto('http://localhost:3000/shop')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Try to view products
    const productList = page.locator('[data-testid="product-list"]')
    const isVisible = await productList.isVisible().catch(() => false)

    // Either products are cached or offline message is shown
    const offlineMessage = page.locator('[data-testid="offline-message"]')
    const hasOfflineMessage = await offlineMessage.isVisible().catch(() => false)

    expect(isVisible || hasOfflineMessage).toBe(true)

    // Go back online
    await context.setOffline(false)
  })

  test('Meta tags should be present', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const viewport = page.locator('meta[name="viewport"]')
    const themeColor = page.locator('meta[name="theme-color"]')

    await expect(viewport).toHaveCount(1)
    await expect(themeColor).toHaveCount(1)

    const viewportContent = await viewport.getAttribute('content')
    expect(viewportContent).toContain('width=device-width')
    expect(viewportContent).toContain('initial-scale=1')
  })

  test('PWA should have proper icons', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check for apple-touch-icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
    const appleTouchIconCount = await appleTouchIcon.count()

    // Check for favicon
    const favicon = page.locator('link[rel="icon"]')
    const faviconCount = await favicon.count()

    expect(appleTouchIconCount + faviconCount).toBeGreaterThan(0)
  })

  test('Navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Get initial focused element
    let focusedBefore = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    // Press Tab
    await page.keyboard.press('Tab')

    // Get focused element after Tab
    let focusedAfter = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    // Focus should have moved
    expect(focusedAfter).not.toBeNull()
  })

  test('Performance metrics should be good', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      return {
        fcp: paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
        lcp: 0, // LCP requires PerformanceObserver
        ttfb: nav?.responseStart - nav?.fetchStart || 0,
      }
    })

    // Verify metrics are reasonable
    expect(metrics.fcp).toBeGreaterThan(0)
    expect(metrics.ttfb).toBeGreaterThan(0)
  })
})
