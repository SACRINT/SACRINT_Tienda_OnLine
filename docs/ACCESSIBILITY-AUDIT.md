# WCAG 2.1 AA Accessibility Audit

## Overview

Comprehensive accessibility audit checklist ensuring WCAG 2.1 Level AA compliance for the e-commerce platform.

**Audit Date**: November 25, 2025  
**WCAG Version**: 2.1 Level AA  
**Tools Used**: axe DevTools, WAVE, Lighthouse

---

## 1. Perceivable

### 1.1 Text Alternatives

#### 1.1.1 Non-text Content (Level A)

- [ ] All images have alt text
- [ ] Decorative images have alt=""
- [ ] Icon buttons have aria-label
- [ ] Image buttons have alt text
- [ ] SVGs have title/desc elements

**Examples**:

```html
<!-- Good -->
<img src="product.jpg" alt="Blue running shoes, size 10" />
<img src="decorative.png" alt="" role="presentation" />
<button aria-label="Close modal"><XIcon /></button>

<!-- Bad -->
<img src="product.jpg" />
<!-- Missing alt -->
<img src="decorative.png" alt="decoration" />
<!-- Unnecessary -->
```

### 1.2 Time-based Media

Not applicable (no video/audio content)

### 1.3 Adaptable

#### 1.3.1 Info and Relationships (Level A)

- [ ] Headings use proper hierarchy (h1 > h2 > h3)
- [ ] Lists use <ul>/<ol> elements
- [ ] Tables have <th> headers
- [ ] Form labels associated with inputs
- [ ] Landmark regions defined

**Heading Structure**:

```html
<h1>Product Name</h1>
<h2>Description</h2>
<h2>Specifications</h2>
<h3>Dimensions</h3>
<h3>Weight</h3>
<h2>Reviews</h2>
```

#### 1.3.2 Meaningful Sequence (Level A)

- [ ] Content order makes sense when CSS disabled
- [ ] Tab order follows visual order
- [ ] Reading order logical

#### 1.3.3 Sensory Characteristics (Level A)

- [ ] Instructions don't rely solely on shape/color
- [ ] "Click the red button" → "Click the Submit button"
- [ ] Icons supplemented with text

#### 1.3.4 Orientation (Level AA)

- [ ] Content works in portrait and landscape
- [ ] No orientation restrictions (unless essential)

#### 1.3.5 Identify Input Purpose (Level AA)

- [ ] Form inputs have autocomplete attributes
- [ ] Purpose of each input identifiable

```html
<input type="email" autocomplete="email" name="email" />
<input type="tel" autocomplete="tel" name="phone" />
<input type="text" autocomplete="street-address" name="address" />
```

### 1.4 Distinguishable

#### 1.4.1 Use of Color (Level A)

- [ ] Color not sole means of conveying information
- [ ] Links distinguishable without color
- [ ] Error states have icons, not just red color

#### 1.4.2 Audio Control (Level A)

Not applicable (no auto-playing audio)

#### 1.4.3 Contrast (Minimum) (Level AA)

- [ ] Normal text contrast ≥ 4.5:1
- [ ] Large text (18pt+/14pt+ bold) ≥ 3:1
- [ ] UI components and graphics ≥ 3:1

**Color Combinations**:

```
✅ Black #000000 on White #FFFFFF (21:1)
✅ Dark Gray #333333 on White #FFFFFF (12.6:1)
✅ Blue #0066CC on White #FFFFFF (7.7:1)
❌ Light Gray #999999 on White #FFFFFF (2.8:1) - FAIL
```

#### 1.4.4 Resize Text (Level AA)

- [ ] Text can zoom to 200% without loss of content
- [ ] No horizontal scrolling required
- [ ] Layout doesn't break

#### 1.4.5 Images of Text (Level AA)

- [ ] Use actual text instead of images of text
- [ ] Exception: logos

#### 1.4.10 Reflow (Level AA)

- [ ] Content reflows to 320px width
- [ ] No two-dimensional scrolling
- [ ] Responsive design implemented

#### 1.4.11 Non-text Contrast (Level AA)

- [ ] UI components have ≥ 3:1 contrast
- [ ] Focus indicators visible
- [ ] Form field boundaries visible

#### 1.4.12 Text Spacing (Level AA)

- [ ] Line height ≥ 1.5x font size
- [ ] Paragraph spacing ≥ 2x font size
- [ ] Letter spacing ≥ 0.12x font size
- [ ] Word spacing ≥ 0.16x font size

#### 1.4.13 Content on Hover or Focus (Level AA)

- [ ] Hoverable: Content doesn't disappear when pointer moves to it
- [ ] Dismissible: Can close without moving pointer
- [ ] Persistent: Content visible until user action

---

## 2. Operable

### 2.1 Keyboard Accessible

#### 2.1.1 Keyboard (Level A)

- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Tab navigates through interactive elements
- [ ] Enter/Space activates buttons/links

#### 2.1.2 No Keyboard Trap (Level A)

- [ ] Can tab into and out of all components
- [ ] Modal dialogs can be closed with Escape
- [ ] Dropdowns can be dismissed

#### 2.1.4 Character Key Shortcuts (Level A)

- [ ] If shortcuts exist, can be turned off/remapped
- [ ] Only active when component has focus

### 2.2 Enough Time

#### 2.2.1 Timing Adjustable (Level A)

- [ ] User can turn off/adjust time limits
- [ ] Session timeout warnings provided
- [ ] At least 20 seconds to extend timeout

#### 2.2.2 Pause, Stop, Hide (Level A)

- [ ] Auto-updating content can be paused
- [ ] Carousels have pause button
- [ ] Animations can be stopped

### 2.3 Seizures and Physical Reactions

#### 2.3.1 Three Flashes or Below Threshold (Level A)

- [ ] No content flashes more than 3 times/second
- [ ] Animations respect prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.4 Navigable

#### 2.4.1 Bypass Blocks (Level A)

- [ ] Skip to main content link
- [ ] Proper landmark regions
- [ ] Headings allow navigation

```html
<a href="#main" class="skip-to-main">Skip to main content</a>
<main id="main">...</main>
```

#### 2.4.2 Page Titled (Level A)

- [ ] Every page has unique, descriptive title
- [ ] Title describes page content

```html
<title>Blue Running Shoes - Product Detail | StoreName</title>
```

#### 2.4.3 Focus Order (Level A)

- [ ] Focus order follows meaningful sequence
- [ ] Tab order logical and predictable

#### 2.4.4 Link Purpose (In Context) (Level A)

- [ ] Link text describes destination
- [ ] No "Click here" or "Read more" links

```html
<!-- Good -->
<a href="/products/blue-shoes">View Blue Running Shoes</a>

<!-- Bad -->
<a href="/products/blue-shoes">Click here</a>
```

#### 2.4.5 Multiple Ways (Level AA)

- [ ] Multiple ways to find pages (menu, search, sitemap)
- [ ] Breadcrumb navigation available
- [ ] Search functionality works

#### 2.4.6 Headings and Labels (Level AA)

- [ ] Headings descriptive
- [ ] Form labels clear and descriptive

#### 2.4.7 Focus Visible (Level AA)

- [ ] Keyboard focus clearly visible
- [ ] Custom focus styles maintain visibility
- [ ] Focus not hidden by design

```css
/* Good */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Bad */
button:focus {
  outline: none; /* DON'T DO THIS */
}
```

### 2.5 Input Modalities

#### 2.5.1 Pointer Gestures (Level A)

- [ ] Complex gestures have single-pointer alternative
- [ ] Pinch-to-zoom has +/- buttons

#### 2.5.2 Pointer Cancellation (Level A)

- [ ] Actions triggered on up-event, not down-event
- [ ] Can abort click by moving pointer away

#### 2.5.3 Label in Name (Level A)

- [ ] Visible label matches accessible name
- [ ] aria-label includes visible text

#### 2.5.4 Motion Actuation (Level A)

- [ ] Device motion not required
- [ ] Shake-to-undo has button alternative

---

## 3. Understandable

### 3.1 Readable

#### 3.1.1 Language of Page (Level A)

- [ ] Page language declared

```html
<html lang="es-MX"></html>
```

#### 3.1.2 Language of Parts (Level AA)

- [ ] Changes in language marked

```html
<p>Esta es la descripción. <span lang="en">English description here.</span></p>
```

### 3.2 Predictable

#### 3.2.1 On Focus (Level A)

- [ ] Focus doesn't trigger unexpected changes
- [ ] Modal doesn't open on focus alone

#### 3.2.2 On Input (Level A)

- [ ] Input doesn't cause unexpected changes
- [ ] Form submission requires explicit action

#### 3.2.3 Consistent Navigation (Level AA)

- [ ] Navigation in same order across pages
- [ ] Menu items consistent

#### 3.2.4 Consistent Identification (Level AA)

- [ ] Same icons mean same thing
- [ ] Same functions have same labels

### 3.3 Input Assistance

#### 3.3.1 Error Identification (Level A)

- [ ] Errors identified in text
- [ ] Error messages describe problem

```html
<input aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Email must be in format: user@example.com</span>
```

#### 3.3.2 Labels or Instructions (Level A)

- [ ] Form fields have labels
- [ ] Required fields marked
- [ ] Format instructions provided

```html
<label for="phone"> Phone Number <span aria-label="required">*</span> </label>
<input id="phone" required aria-describedby="phone-help" />
<span id="phone-help">Format: (555) 123-4567</span>
```

#### 3.3.3 Error Suggestion (Level AA)

- [ ] Error messages suggest fix
- [ ] Examples provided

#### 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

- [ ] Reversible: Can undo submissions
- [ ] Checked: Data validated before submission
- [ ] Confirmed: Confirmation step for orders

---

## 4. Robust

### 4.1 Compatible

#### 4.1.1 Parsing (Level A)

- [ ] HTML valid (no duplicate IDs)
- [ ] Elements have complete start/end tags
- [ ] Nested correctly

#### 4.1.2 Name, Role, Value (Level A)

- [ ] Custom components have proper ARIA roles
- [ ] States communicated to assistive tech

```html
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div id="menu" hidden>...</div>
```

#### 4.1.3 Status Messages (Level AA)

- [ ] Status messages use aria-live
- [ ] Success/error toasts announced

```html
<div role="status" aria-live="polite">Product added to cart</div>

<div role="alert" aria-live="assertive">Error: Payment failed</div>
```

---

## Testing Tools

### Browser Extensions

- [ ] axe DevTools (Chrome/Firefox)
- [ ] WAVE (Chrome/Firefox/Edge)
- [ ] Lighthouse (Chrome DevTools)

### Screen Readers

- [ ] NVDA (Windows) - Free
- [ ] JAWS (Windows) - Commercial
- [ ] VoiceOver (macOS/iOS) - Built-in
- [ ] TalkBack (Android) - Built-in

### Keyboard Testing

- [ ] Tab key navigation
- [ ] Arrow keys for menus
- [ ] Enter/Space for activation
- [ ] Escape for closing

### Color Contrast Tools

- [ ] WebAIM Contrast Checker
- [ ] Stark (Figma plugin)
- [ ] Chrome DevTools Contrast Ratio

---

## Common Issues & Fixes

### Missing Alt Text

```html
<!-- Fix -->
<img src="product.jpg" alt="Blue running shoes with white stripes" />
```

### Poor Color Contrast

```css
/* Fix */
.text {
  color: #1a1a1a; /* Darker text */
  background: #ffffff;
}
```

### Missing Form Labels

```html
<!-- Fix -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" />
```

### No Focus Visible

```css
/* Fix */
*:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Keyboard Trap

```javascript
// Fix: Allow Escape to close modal
modal.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
```

---

## Audit Results Template

```markdown
## Accessibility Audit Results

**Date**: [Date]
**Auditor**: [Name]
**Tool**: [Tool Name]
**WCAG Level**: AA

### Summary

- Issues Found: X
- Critical: Y
- Moderate: Z
- Minor: W

### Critical Issues

1. [Issue] - [WCAG Criterion] - [Location]
2. ...

### Recommendations

1. [Recommendation]
2. ...

### Sign-off

- [ ] Meets WCAG 2.1 Level AA
- [ ] Requires fixes before deployment
```

---

## Sign-off Checklist

- [ ] All images have alt text
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Focus visible on all elements
- [ ] Screen reader announces correctly
- [ ] Forms have labels
- [ ] Error messages descriptive
- [ ] No flashing content
- [ ] Page titles unique
- [ ] Headings hierarchical

**Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant

---

**Last Updated**: November 25, 2025  
**Next Audit**: Quarterly or after major updates
