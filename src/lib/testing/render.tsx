// React Testing Library Render Utilities

import * as React from "react"
import { render, RenderOptions } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ToastProvider } from "@/components/notifications/Toast"

// All providers wrapper
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}

// Custom render with providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  }
}

// Re-export everything
export * from "@testing-library/react"
export { customRender as render }
export { userEvent }

// Screen queries helpers
export const queries = {
  // By text content
  byText: (text: string | RegExp) => ({ name: text }),

  // By role with name
  byRole: (role: string, name?: string | RegExp) => ({
    role,
    ...(name && { name }),
  }),

  // By label
  byLabel: (label: string | RegExp) => ({ name: label }),

  // By placeholder
  byPlaceholder: (placeholder: string | RegExp) => ({ placeholder }),

  // By test ID
  byTestId: (testId: string) => ({ "data-testid": testId }),
}

// Async helpers
export async function waitForElement(
  callback: () => HTMLElement | null,
  timeout = 1000
): Promise<HTMLElement> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const element = callback()
    if (element) {
      return element
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  throw new Error("Element not found within timeout")
}

// Fire custom events
export function fireCustomEvent(
  element: HTMLElement,
  eventName: string,
  detail?: unknown
) {
  const event = new CustomEvent(eventName, { detail, bubbles: true })
  element.dispatchEvent(event)
}

// Mock component for testing
export function createMockComponent(name: string) {
  return function MockComponent(props: Record<string, unknown>) {
    return (
      <div data-testid={`mock-${name}`} {...props}>
        Mock {name}
      </div>
    )
  }
}

// Snapshot with date replacement
export function createSnapshotWithDates(element: HTMLElement): string {
  return element.outerHTML.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g,
    "DATE_PLACEHOLDER"
  )
}
