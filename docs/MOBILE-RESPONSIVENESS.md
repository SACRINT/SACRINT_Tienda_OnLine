# Mobile Responsiveness Checklist

## Overview

Comprehensive checklist to ensure the e-commerce platform provides an excellent mobile experience across all devices.

**Testing Date**: November 25, 2025  
**Version**: 1.0.0

---

## Device Testing Matrix

### iPhone SE (375px x 667px)

- [ ] Home page renders correctly
- [ ] Navigation hamburger menu accessible
- [ ] Product grid shows 1-2 columns
- [ ] Product images load and scale
- [ ] Add to cart button visible and clickable
- [ ] Cart icon accessible in header
- [ ] Checkout wizard steps navigable
- [ ] Form inputs large enough to type
- [ ] Buttons ≥ 44x44px touch targets

### iPhone 12/13 (390px x 844px)

- [ ] All layouts adapt to width
- [ ] Safe area insets respected
- [ ] Bottom navigation accessible (if implemented)
- [ ] Modals/drawers slide from bottom
- [ ] Touch gestures responsive

### Pixel 4/5 (412px x 915px)

- [ ] Android keyboard doesn't cover inputs
- [ ] Material design elements render
- [ ] Swipe gestures work
- [ ] Pull-to-refresh functions (if implemented)

### iPad (768px x 1024px)

- [ ] Tablet layout between mobile/desktop
- [ ] Product grid shows 2-3 columns
- [ ] Sidebar navigation visible
- [ ] Split-screen multitasking works
- [ ] Touch and pointer input both functional

### iPad Pro (1024px x 1366px)

- [ ] Desktop-like layout on landscape
- [ ] Optimized for large touch targets
- [ ] Keyboard accessories supported
- [ ] Multi-column layouts utilized

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Base styles: 320px - 639px (mobile) */

@media (min-width: 640px) {
  /* sm: 640px - 767px (large mobile / small tablet) */
}

@media (min-width: 768px) {
  /* md: 768px - 1023px (tablet) */
}

@media (min-width: 1024px) {
  /* lg: 1024px - 1279px (small desktop) */
}

@media (min-width: 1280px) {
  /* xl: 1280px+ (desktop) */
}

@media (min-width: 1536px) {
  /* 2xl: 1536px+ (large desktop) */
}
```

---

## Layout Components

### Header/Navigation

#### Mobile (< 768px)

- [ ] Hamburger menu icon (44x44px minimum)
- [ ] Logo centered or left-aligned
- [ ] Cart icon visible and accessible
- [ ] Search icon toggles search bar
- [ ] Menu slides in from left/right
- [ ] Overlay darkens background when menu open

#### Tablet (768px - 1023px)

- [ ] Partial navigation visible
- [ ] Search bar always visible
- [ ] Category dropdowns accessible
- [ ] Account menu in header

#### Desktop (≥ 1024px)

- [ ] Full horizontal navigation
- [ ] Mega menu for categories (if applicable)
- [ ] All elements visible without menu

### Product Grid

#### Mobile (< 640px)

- [ ] 1 column layout
- [ ] Full-width product cards
- [ ] Vertical scroll
- [ ] Load more button or infinite scroll

#### Mobile Large (640px - 767px)

- [ ] 2 column layout
- [ ] Smaller card padding
- [ ] Optimized image sizes

#### Tablet (768px - 1023px)

- [ ] 2-3 column layout
- [ ] Comfortable spacing
- [ ] Hover states (if touch+mouse)

#### Desktop (≥ 1024px)

- [ ] 3-4 column layout
- [ ] Hover effects active
- [ ] Quick view modal

### Forms

#### All Devices

- [ ] Input fields full width on mobile
- [ ] Labels above inputs
- [ ] Helper text below inputs
- [ ] Error messages clearly visible
- [ ] Submit buttons full width on mobile
- [ ] Input type appropriate (email, tel, number)
- [ ] Autocomplete enabled
- [ ] Touch-friendly select dropdowns

### Modals/Dialogs

#### Mobile

- [ ] Slides up from bottom
- [ ] Full screen or nearly full screen
- [ ] Close button top-right
- [ ] Scrollable content
- [ ] Backdrop prevents body scroll

#### Tablet/Desktop

- [ ] Centered overlay
- [ ] Max-width constrained
- [ ] Backdrop closes modal
- [ ] Escape key closes

### Images

#### All Devices

- [ ] Responsive srcset used
- [ ] Next.js Image component
- [ ] Lazy loading below fold
- [ ] Aspect ratio maintained
- [ ] Loading placeholder shown
- [ ] WebP/AVIF formats served

---

## Touch Interactions

### Touch Targets

- [ ] All buttons ≥ 44x44px
- [ ] Links have adequate padding
- [ ] Icon buttons enlarged for mobile
- [ ] Spacing between adjacent buttons
- [ ] No accidental taps

### Gestures

- [ ] Swipe left/right for image gallery
- [ ] Pinch to zoom product images
- [ ] Pull down to refresh (if implemented)
- [ ] Long press for context menu (if applicable)
- [ ] Double tap to zoom (native behavior)

### Scrolling

- [ ] Smooth scrolling
- [ ] No horizontal overflow
- [ ] Sticky headers remain visible
- [ ] Infinite scroll loads seamlessly
- [ ] Back to top button appears on scroll

---

## Typography

### Font Sizes

#### Mobile

- [ ] Body text ≥ 16px (prevents zoom on iOS)
- [ ] Headings scale appropriately
- [ ] Line height 1.5-1.8 for readability
- [ ] Letter spacing adequate

#### Tablet/Desktop

- [ ] Slightly larger body text
- [ ] Headings more prominent
- [ ] Comfortable reading width (60-80 chars)

### Readability

- [ ] High contrast (≥ 4.5:1)
- [ ] No text over busy backgrounds
- [ ] Adequate whitespace
- [ ] Responsive font sizes (clamp)

---

## Specific Page Checks

### Home Page

- [ ] Hero banner full width
- [ ] CTA buttons prominent
- [ ] Featured products grid responsive
- [ ] Categories scroll horizontally on mobile
- [ ] Testimonials/reviews readable
- [ ] Footer stacks vertically on mobile

### Shop Page

- [ ] Filters collapsible on mobile
- [ ] Filter button opens drawer/modal
- [ ] Sort dropdown accessible
- [ ] Product grid adapts to width
- [ ] Pagination or infinite scroll
- [ ] Applied filters shown as chips

### Product Detail

- [ ] Image gallery swipeable on mobile
- [ ] Thumbnails hidden or below main image
- [ ] Product title readable
- [ ] Price prominently displayed
- [ ] Add to cart button sticky on mobile
- [ ] Variant selectors touch-friendly
- [ ] Description expands/collapses
- [ ] Reviews in tabs or accordion

### Cart Page

- [ ] Item list stacks vertically
- [ ] Remove button accessible
- [ ] Quantity +/- buttons large enough
- [ ] Order summary sticky on desktop
- [ ] Checkout button prominent
- [ ] Continue shopping link visible

### Checkout

- [ ] Steps indicated clearly
- [ ] One step per screen on mobile
- [ ] Form fields full width
- [ ] Payment fields (Stripe) mobile-optimized
- [ ] Error messages prominent
- [ ] Submit button always visible

### Account Pages

- [ ] Dashboard cards stack on mobile
- [ ] Order list table scrolls horizontally
- [ ] Profile form full width
- [ ] Tabs convert to select dropdown
- [ ] Settings easy to access

---

## Orientation Testing

### Portrait

- [ ] Default mobile layout
- [ ] Vertical navigation
- [ ] Single column content

### Landscape

- [ ] Adapts to wider viewport
- [ ] Navigation may go horizontal
- [ ] Better utilization of width
- [ ] Video/image galleries optimized

---

## Performance on Mobile

### Page Load

- [ ] First Contentful Paint < 2s on 3G
- [ ] Images lazy loaded
- [ ] Critical CSS inlined
- [ ] JavaScript deferred

### Interactions

- [ ] Tap response < 100ms
- [ ] Smooth scrolling 60fps
- [ ] Animations hardware accelerated
- [ ] No jank during interactions

---

## Testing Tools

### Browser DevTools

```
Chrome DevTools > Device Toolbar
- Select device presets
- Toggle orientation
- Throttle network (3G, 4G)
- Simulate touch events
```

### Real Device Testing

- iOS Safari (iPhone)
- Chrome (Android)
- Samsung Internet
- Test on actual hardware

### Online Tools

- BrowserStack (cross-browser/device)
- Responsively App (multiple viewports)
- LambdaTest

---

## Common Issues & Fixes

### Text Too Small

```css
/* Fix */
body {
  font-size: 16px; /* iOS won't zoom */
}
```

### Horizontal Scroll

```css
/* Fix */
* {
  max-width: 100%;
}
html,
body {
  overflow-x: hidden;
}
```

### Touch Targets Too Small

```css
/* Fix */
button,
a {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

### Fixed Header Covers Content

```css
/* Fix */
main {
  padding-top: 60px; /* header height */
}
```

---

## Accessibility on Mobile

- [ ] Voiceover (iOS) reads content correctly
- [ ] TalkBack (Android) announces elements
- [ ] Focus visible on all interactive elements
- [ ] Zoom up to 200% doesn't break layout
- [ ] Color contrast maintained
- [ ] Text selectable

---

## Sign-off Checklist

- [ ] All device sizes tested
- [ ] Portrait and landscape tested
- [ ] Touch interactions smooth
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Forms usable on mobile
- [ ] Performance acceptable on 3G
- [ ] Accessibility requirements met

**Tested By**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Status**: ✅ Approved / ⚠️ Needs Work / ❌ Failed

---

**Last Updated**: November 25, 2025  
**Next Review**: After major UI changes
