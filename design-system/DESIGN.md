# Building Status Design System

A monochromatic, print-friendly signage system for residential buildings. Designed for regular office printers, minimal ink usage, and clear hierarchy.

## Design Principles

- **Typography-driven**: No heavy borders or boxes. Hierarchy comes from type size and weight.
- **Monochromatic**: Black, white, and gray only. No color coding.
- **Print-friendly**: Minimal ink, no solid black blocks, thin rules only.
- **Consistent**: Same header treatment, same grid structure, same QR placement across all templates.

## Typography

**Font**: Inter (Google Fonts)

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
| Giant headline | 72pt | 900 | -0.04em | Maintenance sign titles |
| Building name (large) | 36pt | 900 | -0.03em | Lobby poster |
| Section headline | 28pt | 900 | -0.03em | QR headlines |
| Unit number | 28pt | 900 | -0.03em | Unit cards |
| Large value | 18-20pt | 800 | -0.02em | Phone numbers, key info |
| Body/URL | 13-14pt | 700 | — | URLs, detail values |
| Building name (small) | 11-12pt | 800 | 0.06-0.08em | Unit cards, uppercase |
| Labels | 7-8pt | 700 | 0.08-0.1em | Section labels, uppercase |
| Meta/notes | 8-9pt | 400-600 | — | Footers, secondary info |

## Colors

```css
--black: #1a1a1a;
--white: #ffffff;
--gray: #666666;
--gray-light: #f5f5f5;  /* QR placeholders, waste grid backgrounds */
```

No other colors. Status types (outage, scheduled, resolved, notice) are differentiated by copy, not color.

## Layout Rules

### Headers
- 2px solid black bottom border
- Building name left, meta/date right
- Margin below: 0.25-0.35in

### Section Dividers
- 1px solid #ddd
- Never use heavy borders or boxes

### QR Codes
- Light gray (#f5f5f5) background placeholder
- Sizes: 2.4in (lobby hero), 1.6in (maintenance), 1.4in (unit cards)
- Always paired with headline, subline, and URL

### Spacing
- Page padding: 0.5in (full page), 0.25-0.3in (cards)
- Section gaps: 0.25-0.4in
- Tight line-height: 1.1-1.3

## Components

### Status Badge (maintenance signs only)
```css
.status-badge {
  font-size: 9pt;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 14px;
  border: 2px solid #1a1a1a;
}

/* Urgent variant only */
.status-badge.urgent {
  background: #1a1a1a;
  color: #ffffff;
}
```

### Label + Value Pattern
```html
<div class="info-item">
  <p class="label">Super</p>
  <p class="value">555-123-4567</p>
  <p class="meta">Mon–Fri 9–5</p>
</div>
```

### Waste Grid
Light gray background boxes, centered text:
```html
<div class="waste-item">
  <p class="waste-type">Trash</p>
  <p class="waste-days">Tu / Fr</p>
</div>
```

## Template Types

### 1. Unit Cards (4 per page)
- Purpose: Fridge magnet / door card for residents
- Size: Quarter letter (4.25 x 5.25in effective)
- Key elements: Unit number (prominent), QR code, super phone, waste schedule
- URL strategy: Shared property URL displayed (e.g., `lh.app/billy`), unit-specific auth token embedded in QR only

### 2. Maintenance Signs (full page)
- Purpose: Posted during outages, scheduled maintenance, or announcements
- Variants: Outage (urgent), Scheduled, Resolved, Notice
- Key elements: Giant title (72pt), status badge, details grid, QR for live updates
- Only "urgent" outages get inverted (white on black) badge

### 3. Lobby Poster (full page)
- Purpose: Permanent posting in laundry room or lobby
- Key elements: Building name hero, large QR, contacts grid, waste schedule, quick links

## File Structure

```
/design-system/
  DESIGN.md          # This file
  /templates/
    unit-cards.html
    maintenance-signs.html
    lobby-poster.html
```

## Implementation Notes

When generating React/JSX components from these templates:

1. **Use CSS custom properties** for the color palette
2. **Inter font** should be loaded from Google Fonts or bundled
3. **Print styles** should use `@media print` and `print-color-adjust: exact`
4. **QR codes** will be generated dynamically, use a placeholder div with the sizing
5. **Data-driven content**: All text should come from props, templates show structure only
6. **Status-driven variants**: Use a `status` or `type` prop to switch between maintenance sign variants

## Don'ts

- No heavy borders (more than 2px)
- No solid black blocks or backgrounds (except urgent badge)
- No color coding
- No rounded corners
- No drop shadows
- No decorative elements
- No emoji in printed materials (except footer location pin if desired)
